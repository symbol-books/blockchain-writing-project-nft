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
  MetadataTransactionService,
  NetworkType,
} from 'symbol-sdk';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';
import { epochAdjustment, networkType } from '@/consts/blockchainProperty';

export const createNFTTransaction = (
  name: string,
  imageUrl: string,
  description: string,
  clientPublicKey: string
): {transaction:Transaction, mosaicId:MosaicId} => {

  const nonce = MosaicNonce.createRandom();
  const clientPublicAccount = PublicAccount.createFromPublicKey(clientPublicKey, networkType);
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
    Convert.utf8ToUint8(name).length,
    Convert.utf8ToUint8(name),
    networkType,
  );
  const imageUrlMetadataTransaction = MosaicMetadataTransaction.create(
    Deadline.create(epochAdjustment),
    clientPublicAccount.address,
    KeyGenerator.generateUInt64Key('IMAGE'),
    mosaicId,
    Convert.utf8ToUint8(imageUrl).length,
    Convert.utf8ToUint8(imageUrl),
    networkType,
  );
  const descriptionMetadataTransaction = MosaicMetadataTransaction.create(
    Deadline.create(epochAdjustment),
    clientPublicAccount.address,
    KeyGenerator.generateUInt64Key('DESCRIPTION'),
    mosaicId,
    Convert.utf8ToUint8(description).length,
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
