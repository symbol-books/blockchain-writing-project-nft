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
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const NODE = await connectNode(nodeList);
    if (NODE === '') return '';
    const repo = new RepositoryFactoryHttp(NODE, {
      websocketUrl: NODE.replace('http', 'ws') + '/ws',
      websocketInjected: WebSocket,
    });
    const txRepo = repo.createTransactionRepository();
    const listener = repo.createListener();

    const epochAdjustment = await firstValueFrom(repo.getEpochAdjustment());
    const generationHash = await firstValueFrom(repo.getGenerationHash());
    const networkType = await firstValueFrom(repo.getNetworkType());
    const currencies = await firstValueFrom(repo.getCurrencies());

    const admin = Account.createFromPrivateKey(process.env.PRIVATE_KEY!, networkType);
    const clientAddress = Address.createFromRawAddress(req.body.address);

    const tx = TransferTransaction.create(
      Deadline.create(epochAdjustment),
      clientAddress,
      [new Mosaic(currencies.currency.mosaicId as MosaicId, UInt64.fromUint(1000000))],
      EmptyMessage,
      networkType
    ).setMaxFee(100);

    const signedTx = admin.sign(tx, generationHash);
    await firstValueFrom(txRepo.announce(signedTx));
    await listener.open();
    const transactionHash: string = await new Promise((resolve) => {
      const timerId = setTimeout(async function () {
        try {
          //アナウンスと同時に承認されタイミング悪く監視上は検知できなかった場合の処理
          const transactionStatusUrl = NODE + '/transactionStatus/' + signedTx.hash;
          const response = await axios.get(transactionStatusUrl);
          console.log(response);
          if (response.data.code == 'Success') {
            resolve(signedTx.hash);
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        }
      }, 3000); //３秒以内未承認を検知できなければ
      listener.unconfirmedAdded(clientAddress, signedTx.hash).subscribe((unconfirmedTx) => {
        console.log(unconfirmedTx);
        const transactionHash = unconfirmedTx.transactionInfo?.hash;
        listener.close();
        clearTimeout(timerId);
        resolve(transactionHash ?? '');
      });
    });
    return res.status(200).json(transactionHash);
  }
}