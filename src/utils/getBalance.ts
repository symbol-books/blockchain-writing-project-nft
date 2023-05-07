import { nodeList } from '@/consts/nodeList';
import { Address, RepositoryFactoryHttp, Mosaic, MosaicId } from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from './connectNode';

export const getBalance = async (address: string): Promise<string | null> => {
  const NODE = await connectNode(nodeList);
  if (NODE === null) return null;
  const repo = new RepositoryFactoryHttp(NODE);
  const mosaicRepo = repo.createMosaicRepository();
  const accountRepo = repo.createAccountRepository();
  const accountAddress = Address.createFromRawAddress(address);
  const accountInfo = await firstValueFrom(accountRepo.getAccountInfo(accountAddress));
  accountInfo.mosaics.forEach(async (mosaic: Mosaic) => {
    const mosaicInfo = await firstValueFrom(mosaicRepo.getMosaic(mosaic.id as MosaicId));
    const mosaicAmount = mosaic.amount.toString();
    const divisibility = mosaicInfo.divisibility;
    let displayAmount = '';

    if (divisibility > 0) {
      if (Number(mosaicAmount) / 10 ** divisibility >= 1) {
        displayAmount =
          mosaicAmount.slice(0, mosaicAmount.length - divisibility) +
          '.' +
          mosaicAmount.slice(-divisibility);
      } else {
        displayAmount =
          '0.' +
          '0'.repeat(divisibility - mosaicAmount.slice(-divisibility).length) +
          mosaicAmount.slice(-divisibility);
      }
    } else {
      displayAmount = mosaicAmount;
    }
    console.log('id:' + mosaic.id.toHex() + ' amount:' + displayAmount);
  });
  return accountInfo.mosaics.length > 0 ? accountInfo.mosaics[0].amount.toString() : '0';
};
