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
  if (NODE === null) return '';
  const repo = new RepositoryFactoryHttp(NODE);
  const txRepo = repo.createTransactionRepository();

  const epochAdjustment = await firstValueFrom(repo.getEpochAdjustment());
  const generationHash = await firstValueFrom(repo.getGenerationHash());
  const networkType = await firstValueFrom(repo.getNetworkType());

  const wsEndpoint = NODE.replace('http', 'ws') + '/ws';
  const ws = new WebSocket(wsEndpoint);

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
  const transactionStatusUrl = NODE + '/transactionStatus/' + signedTx.hash;

  return new Promise((resolve, reject) => {
    ws.onopen = function (e) {};
    ws.onmessage = function (event) {
      const response = JSON.parse(event.data);
      if ('uid' in response) {
        const uid = response.uid;
        const body = '{"uid":"' + uid + '","subscribe":"block"}';
        const transaction =
          '{"uid":"' + uid + '","subscribe":"confirmedAdded/' + client.address.plain() + '"}';
        ws.send(body);
        ws.send(transaction);
      }
      if (response.topic == 'confirmedAdded/' + client.address.plain()) {
        const transactionHash = response.data.meta.hash;
        ws.close();
        resolve(transactionHash);
      }
    };
    setTimeout(() => {
      ws.close();
      reject(new Error(transactionStatusUrl));
    }, 60000); //60秒でタイムアウト
  });
};
