import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Account,
  Address,
  Deadline,
  EmptyMessage,
  Mosaic,
  MosaicId,
  RepositoryFactoryHttp,
  TransactionStatus,
  TransferTransaction,
  UInt64,
} from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';

export default async function handler(req: NextApiRequest, res: NextApiResponse):Promise<TransactionStatus | undefined> {
  if (req.method === 'POST') {
    console.log('start')
    console.time('time')
    const NODE = await connectNode(nodeList);
    if (NODE === '') return undefined;
    console.log('connectNode')
    console.timeLog('time')
    const repo = new RepositoryFactoryHttp(NODE, {
      websocketUrl: NODE.replace('http', 'ws') + '/ws',
      websocketInjected: WebSocket,
    });
    const txRepo = repo.createTransactionRepository();
    const tsRepo = repo.createTransactionStatusRepository();
    const listener = repo.createListener();

    const epochAdjustment = await firstValueFrom(repo.getEpochAdjustment());
    const generationHash = await firstValueFrom(repo.getGenerationHash());
    const networkType = await firstValueFrom(repo.getNetworkType());
    const currencies = await firstValueFrom(repo.getCurrencies());
    console.log('firstValueFroms')
    console.timeLog('time')

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
    const transactionStatus: TransactionStatus = await new Promise((resolve) => {
      //承認トランザクションの検知
      listener.unconfirmedAdded(clientAddress,signedTx.hash).subscribe(async(unconfirmedTx) => {
        console.log('unconfirmedAdded')
        console.timeLog('time')  
        const response:TransactionStatus = await firstValueFrom(tsRepo.getTransactionStatus(signedTx.hash))
        listener.close();
        clearTimeout(timerId);  
        resolve(response);
      });
      //トランザクションでエラーが発生した場合の処理
      const timerId = setTimeout(async function () {
        const response = await firstValueFrom(tsRepo.getTransactionStatus(signedTx.hash))
        if (response.code === 'Success') {
          console.log(response.code)
          console.timeLog('time')    
          listener.close();
          resolve(response);
        }
        //トランザクションでエラーが発生した場合の処理
        else{
          console.log(response.code)
          console.timeLog('time')
          listener.close();
          resolve(response);
        }
      }, 1000); //タイマーを1秒に設定
    });
    res.status(200).json(transactionStatus);
    return
  }
}