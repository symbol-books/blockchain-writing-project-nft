import {
  AggregateTransaction,
  Deadline,
  KeyGenerator,
  MosaicDefinitionTransaction,
  MosaicFlags,
  MosaicId,
  MosaicMetadataTransaction,
  MosaicNonce,
  MosaicSupplyChangeAction,
  MosaicSupplyChangeTransaction,
  PublicAccount,
  RepositoryFactoryHttp,
  UInt64,
  Convert,
  Transaction,
} from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';

//SSS用設定
interface SSSWindow extends Window {
  SSS: any
}

export const createNFTTransaction = async (
  name: string,
  imageUrl: string,
  description: string,
): Promise<{transaction:Transaction, mosaicId:MosaicId} | undefined> => {
  // ): Promise<TransactionStatus | undefined> => {
  const NODE = await connectNode(nodeList);
  if (NODE === '') return undefined;
  const repo = new RepositoryFactoryHttp(NODE, {
    websocketUrl: NODE.replace('http', 'ws') + '/ws',
    websocketInjected: WebSocket,
  });
  const epochAdjustment = await firstValueFrom(repo.getEpochAdjustment());
  const networkType = await firstValueFrom(repo.getNetworkType());
  const nonce = MosaicNonce.createRandom();
  const clientPublicAccount = PublicAccount.createFromPublicKey(window.SSS.activePublicKey, networkType);
  const mosaicId = MosaicId.createFromNonce(nonce, clientPublicAccount.address); 
  const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
    Deadline.create(epochAdjustment),
    nonce,
    mosaicId,
    MosaicFlags.create(false,true,false,false),
    0,
    UInt64.fromUint(0),
    networkType
  ).setMaxFee(100);

  const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
    Deadline.create(epochAdjustment),
    mosaicId,
    MosaicSupplyChangeAction.Increase,
    UInt64.fromUint(1),
    networkType,
  );
  const nameMetadataTransaction = MosaicMetadataTransaction.create(
    Deadline.create(epochAdjustment),
    clientPublicAccount.address,
    KeyGenerator.generateUInt64Key('NAME'),
    mosaicId,
    name.length,
    Convert.utf8ToUint8(name),
    networkType,
  );
  const imageUrlMetadataTransaction = MosaicMetadataTransaction.create(
    Deadline.create(epochAdjustment),
    clientPublicAccount.address,
    KeyGenerator.generateUInt64Key('IMAGE'),
    mosaicId,
    imageUrl.length,
    Convert.utf8ToUint8(imageUrl),
    networkType,
  );
  const descriptionMetadataTransaction = MosaicMetadataTransaction.create(
    Deadline.create(epochAdjustment),
    clientPublicAccount.address,
    KeyGenerator.generateUInt64Key('DESCRIPTION'),
    mosaicId,
    description.length,
    Convert.utf8ToUint8(description),
    networkType,
  );
  console.log(name,imageUrl,description);
  const aggregateTransaction = AggregateTransaction.createComplete(
    Deadline.create(epochAdjustment),
    [
      mosaicDefinitionTransaction.toAggregate(clientPublicAccount),
      mosaicSupplyChangeTransaction.toAggregate(clientPublicAccount),
      nameMetadataTransaction.toAggregate(clientPublicAccount),
      imageUrlMetadataTransaction.toAggregate(clientPublicAccount),
      descriptionMetadataTransaction.toAggregate(clientPublicAccount)
    ],
    networkType,
    [],
  ).setMaxFeeForAggregate(100,1);

  return {
    transaction:aggregateTransaction,
    mosaicId:mosaicId
  };
};
