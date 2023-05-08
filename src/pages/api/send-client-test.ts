import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Account,
  Address,
  Deadline,
  EmptyMessage,
  Mosaic,
  MosaicId,
  RepositoryFactoryHttp,
  TransferTransaction,
  UInt64,
} from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import { WebSocket } from 'ws';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';

type responseType = {
  statusCode: number;
  body: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const NODE = await connectNode(nodeList);
    if (NODE === '') return '';
    // 環境変数から呼び出し
    const repo = new RepositoryFactoryHttp(NODE);
    const txRepo = repo.createTransactionRepository();
    const epochAdjustment = await firstValueFrom(repo.getEpochAdjustment());
    const generationHash = await firstValueFrom(repo.getGenerationHash());
    const networkType = await firstValueFrom(repo.getNetworkType());
    const minFeeMultiplier = 100;

    const privatekey = process.env.PRIVATE_KEY!;
    const admin = Account.createFromPrivateKey(privatekey, networkType);
    const recipientAddress = Address.createFromRawAddress(req.body.address);

    // 転送トランザクション作成
    const transferTx = TransferTransaction.create(
      Deadline.create(epochAdjustment),
      recipientAddress,
      [new Mosaic(new MosaicId('72C0212E67A08BCE'), UInt64.fromUint(1000000))],
      EmptyMessage,
      networkType
    ).setMaxFee(minFeeMultiplier);

    // 署名およびアナウンス
    if (generationHash == undefined) throw new Error('generationHash not found.');
    const signedTx = admin.sign(transferTx, generationHash);
    await firstValueFrom(txRepo.announce(signedTx));

    // アナウンスしたトランザクションの監視
    const transactionStatusUrl = NODE + '/transactionStatus/' + signedTx.hash;
    const wsEndpoint = NODE.replace('http', 'ws') + '/ws';
    const ws = new WebSocket(wsEndpoint);
    ws.onopen = () => console.log('start monitoring transaction');

    const res2 = (): Promise<string> => {
      return new Promise((resolve) => {
        ///監視をスタートして10秒間トランザクションを検知できなかった時の処理
        const timerId = setTimeout(async function () {
          try {
            const response = await axios.get(transactionStatusUrl);
            ///アナウンスと同時に承認されタイミング悪く監視上は検知できなかった場合の処理
            if (response.data.code == 'Success') {
              resolve(signedTx.hash);
              ///残高不足やアドレスが見つからないなどで通知はされたが承認されなかった場合の処理
            } else {
              resolve('');
            }
            ///手数料不足などでアナウンスされたトランザクションがノードに認識されていない状態
          } catch {
            resolve('');
          }
        }, 10000);

        // 監視をスタートして10秒以内にトランザクションを検知できた時の処理
        ws.onmessage = (e) => {
          const response = JSON.parse(e.data.toString());
          if ('uid' in response) {
            const body = '{"uid":"' + response.uid + '", "subscribe":"block"}';
            const transaction =
              '{"uid":"' +
              response.uid +
              '","subscribe":"unconfirmedAdded/' +
              recipientAddress.plain() +
              '"}';
            ws.send(body);
            ws.send(transaction);
          }
          if (response.topic == 'unconfirmedAdded/' + recipientAddress.plain()) {
            console.log('close');
            ws.close();
            clearTimeout(timerId);
            resolve(signedTx.hash);
          }
        };
      });
    };

    const r = await res2();
    console.log(r)
    return res.status(200).json(r);
  } catch (e) {
    console.error(e);
    return '';
  }
};