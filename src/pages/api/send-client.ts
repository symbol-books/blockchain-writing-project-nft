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
import {
  currencyMosaicId,
  epochAdjustment,
  generationHash,
  networkType,
} from '@/consts/blockchainProperty';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    console.time("connectNode");
    const NODE = await connectNode(nodeList);
    console.timeEnd("connectNode");
    console.time("beforeListener");
    if (NODE === '') return '';
    const repo = new RepositoryFactoryHttp(NODE, {
      websocketUrl: NODE.replace('http', 'ws') + '/ws',
      websocketInjected: WebSocket,
    });
    const txRepo = repo.createTransactionRepository();
    const listener = repo.createListener();
    const admin = Account.createFromPrivateKey(process.env.PRIVATE_KEY!, networkType);
    const clientAddress = Address.createFromRawAddress(req.body.address);

    const tx = TransferTransaction.create(
      Deadline.create(epochAdjustment),
      clientAddress,
      [new Mosaic(new MosaicId(currencyMosaicId), UInt64.fromUint(1000000))],
      EmptyMessage,
      networkType
    ).setMaxFee(100);

    const signedTx = admin.sign(tx, generationHash);
    await firstValueFrom(txRepo.announce(signedTx));
    console.timeEnd("beforeListener");
    await listener.open();
    console.time("afterListener");
    const transactionHash: string = await new Promise((resolve) => {
      listener.unconfirmedAdded(clientAddress, signedTx.hash).subscribe((unconfirmedTx) => {
        console.timeEnd("afterListener");
        console.log(unconfirmedTx);
        const transactionHash = unconfirmedTx.transactionInfo?.hash;
        listener.close();
        resolve(transactionHash ?? '');
      });
    });
    return res.status(200).json(transactionHash);
  }
}
