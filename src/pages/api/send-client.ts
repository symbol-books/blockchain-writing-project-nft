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
    await listener.open();
    const transactionHash: string = await new Promise(async(resolve) => {
      await firstValueFrom(txRepo.announce(signedTx));
      listener.unconfirmedAdded(clientAddress, signedTx.hash).subscribe((unconfirmedTx) => {
        console.log(unconfirmedTx);
        const transactionHash = unconfirmedTx.transactionInfo?.hash;
        listener.close();
        resolve(transactionHash ?? '');
      });
    });
    return res.status(200).json(transactionHash);
  }
}