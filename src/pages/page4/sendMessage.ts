import { networkType } from '@/consts/blockchainProperty';
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
import { firstValueFrom, retry } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';

export const sendMessage = async (clientPrivateKey: string): Promise<string> => {
  return '';
  // const NODE = await connectNode(nodeList);
  // if (NODE === null) return '';
  // const repo = new RepositoryFactoryHttp(NODE);
  // const txRepo = repo.createTransactionRepository();
  // const listener = repo.createListener();

  // const epochAdjustment = await firstValueFrom(repo.getEpochAdjustment());
  // const generationHash = await firstValueFrom(repo.getGenerationHash());
  // const networkType = await firstValueFrom(repo.getNetworkType());
  // const currencies = await firstValueFrom(repo.getCurrencies());

  // const client = Account.createFromPrivateKey(
  //   clientPrivateKey,
  //   networkType
  // );

  // const adminAddress = Address.createFromRawAddress(req.body.address);

  // const tx = TransferTransaction.create(
  //   Deadline.create(epochAdjustment),
  //   clientAddress,
  //   [
  //     new Mosaic(
  //       currencies.currency.mosaicId as MosaicId,
  //       UInt64.fromUint(1000000)
  //     ),
  //   ],
  //   EmptyMessage,
  //   networkType
  // ).setMaxFee(100);

  // const signedTx = admin.sign(tx, generationHash);
  // await firstValueFrom(txRepo.announce(signedTx));

  // await listener.open();
  // listener.unconfirmedAdded(clientAddress).subscribe((unconfirmedTx) => {
  //   console.log(unconfirmedTx);
  //   const transactionHash = unconfirmedTx.transactionInfo?.hash;
  //   listener.close();
  //   return transactionHash;
  // });
};
