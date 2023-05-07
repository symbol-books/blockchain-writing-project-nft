import type { NextApiRequest, NextApiResponse } from 'next';
import { Account, RepositoryFactoryHttp } from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const NODE = await connectNode(nodeList);
    if (NODE === null) return '';
    const repo = new RepositoryFactoryHttp(NODE);
    const networkType = await firstValueFrom(repo.getNetworkType());

    const admin = Account.createFromPrivateKey(process.env.PRIVATE_KEY!, networkType);
    const adminAddress = admin.address.plain();
    return res.status(200).json(adminAddress);
  }
}
