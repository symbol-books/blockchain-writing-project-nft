import {
  Account,
  Address,
  Deadline,
  PlainMessage,
  RepositoryFactoryHttp,
  TransferTransaction,
} from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';

export const sendMessage = async (
  clientPrivateKey: string,
  adminAddress: string
): Promise<string> => {
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

  const client = Account.createFromPrivateKey(clientPrivateKey, networkType);

  const tx = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    Address.createFromRawAddress(adminAddress),
    [],
    PlainMessage.create('Hello Symbol!'),
    networkType
  ).setMaxFee(100);

  const signedTx = client.sign(tx, generationHash);
  await firstValueFrom(txRepo.announce(signedTx));

  await listener.open();
  const transactionHash: string = await new Promise((resolve) => {
    listener.confirmed(client.address, signedTx.hash).subscribe((confirmedTx) => {
      console.log(confirmedTx);
      const transactionHash = confirmedTx.transactionInfo?.hash;
      listener.close();
      resolve(transactionHash ?? '');
    });
  });
  return transactionHash;
};