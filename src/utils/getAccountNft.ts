import {
    Address,
    KeyGenerator,
    RepositoryFactoryHttp,
  } from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';

import {getMosaicInfo} from '@/utils/getMosaicInfo';
  
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
    const acRepo = repo.createAccountRepository();

    const nameKey = KeyGenerator.generateUInt64Key('NAME').toHex()
    const imageUrlKey = KeyGenerator.generateUInt64Key('IMAGE').toHex()
    const descriptionKey = KeyGenerator.generateUInt64Key('DESCRIPTION').toHex()
  
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
  
  
  