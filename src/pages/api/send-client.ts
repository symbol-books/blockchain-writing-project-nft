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

    //未承認トランザクションの検知
    listener.unconfirmedAdded(clientAddress).subscribe((unconfirmedTx) => {
      console.log(unconfirmedTx);
      if (unconfirmedTx.transactionInfo?.hash === signedTx.hash) {
        listener.close();
        clearTimeout(timerId);
        res.status(200).json(signedTx.hash);
        return;
      }
    });
    
    const timerId = setTimeout(async function () {
      const response = await axios.get(NODE + '/transactionStatus/' + signedTx.hash);
      console.log(response);
      //未承認が検知できなかった場合の処理
      if (response.data.code == 'Success') {
        listener.close();
        res.status(200).json(signedTx.hash);
        return;
      }
      //トランザクションでエラーが発生した場合の処理
      else{
        listener.close();
        res.status(400).json('');
        return;
      }
    }, 3000); //タイマーを３秒に設定
  }
}