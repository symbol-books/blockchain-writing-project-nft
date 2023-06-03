import {
    Metadata,
    MosaicId,
    MosaicInfo,
    RepositoryFactoryHttp,
  } from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';

  export const getMosaicInfo = async (
    id: string,
  ): Promise<{mosaicInfo:MosaicInfo, metadata:Metadata[]} | undefined> => {
    const NODE = await connectNode(nodeList);
    if (NODE === '') return undefined;
    const repo = new RepositoryFactoryHttp(NODE, {
      websocketUrl: NODE.replace('http', 'ws') + '/ws',
      websocketInjected: WebSocket,
    });

    const metaRepo = repo.createMetadataRepository();
    const mosaicRepo = repo.createMosaicRepository();
    const mosaicId = new MosaicId(id);
    const metadata = (await firstValueFrom(metaRepo.search({targetId:mosaicId}))).data;
    const mosaicInfo = await firstValueFrom(mosaicRepo.getMosaic(mosaicId));

    return {mosaicInfo:mosaicInfo, metadata:metadata};
  };
  
  
  