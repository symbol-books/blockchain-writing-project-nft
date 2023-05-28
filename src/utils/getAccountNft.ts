import {
    Account,
    Address,
    Deadline,
    KeyGenerator,
    Metadata,
    MosaicInfo,
    PlainMessage,
    RepositoryFactoryHttp,
    SignedTransaction,
    TransactionHttp,
    TransactionStatus,
    TransferTransaction,
  } from 'symbol-sdk';
  import { firstValueFrom } from 'rxjs';
  import { connectNode } from '@/utils/connectNode';
  import { nodeList } from '@/consts/nodeList';
  import axios from 'axios';

  import {getMosaicInfo} from '@/utils/getMosaicInfo';
  
  //SSS用設定
  interface SSSWindow extends Window {
    SSS: any
  }
  declare const window: SSSWindow

  interface NftInfo {
    mosaicInfo:MosaicInfo,
    metadata:Metadata[]
  }

interface NFT {
    mosaicId:string,
    name: string,
    imageUrl:string,
    description:string
}
  
  export const getAccountNft = async (
    address: string,
  ): Promise<NFT[]| undefined> => {
    const NODE = await connectNode(nodeList);
    if (NODE === '') return undefined;
    const repo = new RepositoryFactoryHttp(NODE, {
      websocketUrl: NODE.replace('http', 'ws') + '/ws',
      websocketInjected: WebSocket,
    });
    const txRepo = repo.createTransactionRepository();
    const tsRepo = repo.createTransactionStatusRepository();
    const acRepo = repo.createAccountRepository();
    const listener = repo.createListener();

    const nameKey = KeyGenerator.generateUInt64Key('NAME').toHex()
    const imageUrlKey = KeyGenerator.generateUInt64Key('IMAGE').toHex()
    const descriptionKey = KeyGenerator.generateUInt64Key('DESCRIPTION').toHex()
  
    const epochAdjustment = await firstValueFrom(repo.getEpochAdjustment());
    const generationHash = await firstValueFrom(repo.getGenerationHash());
    const networkType = await firstValueFrom(repo.getNetworkType());
    const clientAddress = Address.createFromRawAddress(address);
    const accountInfo = await firstValueFrom(acRepo.getAccountInfo(clientAddress));
    const accountMosaics = accountInfo.mosaics;

    // 規格に合致するものだけに絞りこむ
    const nftMosaics:NFT[] = [];
    for(const mosaic of accountMosaics){
        const mosaicInfo = await getMosaicInfo(mosaic.id.toHex());
        if(typeof(mosaicInfo)!=="undefined" && mosaicInfo.metadata.length ===3){
            const nameInfo = mosaicInfo?.metadata.find(item=>item.metadataEntry.scopedMetadataKey.toHex() === nameKey);
            const imageUrlInfo = mosaicInfo?.metadata.find(item=>item.metadataEntry.scopedMetadataKey.toHex() === imageUrlKey);
            const descriptionInfo = mosaicInfo?.metadata.find(item=>item.metadataEntry.scopedMetadataKey.toHex() === descriptionKey);
            if(typeof(nameInfo) !== 'undefined' && typeof(imageUrlInfo) !== 'undefined'&& typeof(descriptionInfo) !== 'undefined'){
                console.log(mosaicInfo)
                nftMosaics.push({
                    mosaicId:mosaicInfo.mosaicInfo.id.toHex(),
                    name:nameInfo.metadataEntry.value,
                    imageUrl: imageUrlInfo.metadataEntry.value,
                    description: descriptionInfo.metadataEntry.value
                })
            }
        }
    };
    return nftMosaics
  };
  
  
  