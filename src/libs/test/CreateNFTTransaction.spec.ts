import { 
    createNFTTransaction
} from '@/utils/createNFTTransaction';
import {
    Account,
    KeyGenerator,
    MosaicId,
    MosaicSupplyChangeAction,
    NetworkType,
    Transaction,
    TransactionType,
    UInt64
} from 'symbol-sdk';

const account = Account.generateNewAccount(NetworkType.TEST_NET);

describe('NFT transaction', () => {
    describe('生成されるNFTの情報の確認', () => {

        const name = 'testNFTName';
        const imageUrl = 'https://placehold.jp/300x200.png';
        const nameKey = KeyGenerator.generateUInt64Key('NAME');
        const imageKey = KeyGenerator.generateUInt64Key('IMAGE');
        const descriptionKey = KeyGenerator.generateUInt64Key('DESCRIPTION');



        (async ()=>{
            const description = 'NFTの説明文'
            const transaction: {transaction:Transaction, mosaicId:MosaicId} = createNFTTransaction(name, imageUrl, description, account.publicKey);
            const tx = transaction?.transaction;
            const mosaicId = transaction?.mosaicId;
    
            test('トランザクションのTransactionType', () => {
            expect(tx.type).toEqual(TransactionType.AGGREGATE_COMPLETE);
            });
    
            test('インナートランザクションの数', () => {
            expect(tx?.innerTransactions.length).toEqual(5);
            });
    
            test('インナートランザクションのTransactionType', () => {
            expect(tx.innerTransactions[0].type).toEqual(TransactionType.MOSAIC_DEFINITION);
            });
    
            test('モザイク制限が不可になっているか', () => {
            expect(tx.innerTransactions[0].flags.restrictable).toBeFalsy();
            });
    
            test('モザイクの供給量変化が不可になっているか', () => {
            expect(tx.innerTransactions[0].flags.supplyMutable).toBeFalsy();
            });
    
            test('モザイクが転送可能になっているか', () => {
            expect(tx.innerTransactions[0].flags.transferable).toBeTruthy();
            });
    
            test('モザイクが没取不可になっているか', () => {
            expect(tx.innerTransactions[0].flags.rrevocable).toBeFalsy();
            });
    
            test('モザイクの可分性が0であるか', () => {
            expect(tx.innerTransactions[0].divisibility).toEqual(0);
            });
    
            test('モザイクが無期限で発行されているか', () => {
            expect(tx.innerTransactions[0].duration).toEqual(UInt64.fromUint(0));
            });
    
            test('インナートランザクションのTransactionType', () => {
            expect(tx.innerTransactions[1].type).toEqual(TransactionType.MOSAIC_SUPPLY_CHANGE);
            });
    
            test('供給量が増加されているか', () => {
            expect(tx.innerTransactions[1].action).toEqual(MosaicSupplyChangeAction.Increase);
            });
    
            test('供給量が1であるか', () => {
            expect(tx.innerTransactions[1].delta).toEqual(UInt64.fromUint(1));
            });
    
            test('インナートランザクションのTransactionType', () => {
            expect(tx.innerTransactions[2].type).toEqual(TransactionType.MOSAIC_METADATA);
            });
    
            test('NFTのscopedMetadataKeyが"NAME"から生成されているか', () => {
            expect(tx.innerTransactions[2].scopedMetadataKey).toEqual(nameKey);
            });
    
            test('インナートランザクションのTransactionType', () => {
            expect(tx.innerTransactions[3].type).toEqual(TransactionType.MOSAIC_METADATA);
            });
    
            test('NFTのscopedMetadataKeyが"IMAGE"から生成されているか', () => {
            expect(tx.innerTransactions[3].scopedMetadataKey).toEqual(imageKey);
            });
    
            test('インナートランザクションのTransactionType', () => {
            expect(tx.innerTransactions[4].type).toEqual(TransactionType.MOSAIC_METADATA);
            });
    
            test('NFTのscopedMetadataKeyが"DESCRIPTION"から生成されているか', () => {
            expect(tx.innerTransactions[4].scopedMetadataKey).toEqual(descriptionKey);
            });
    
            test('供給量が1であるか', () => {
            expect(tx.innerTransactions[1].mosaicId.equals(mosaicId)).toBeTruthy();
            });
        })();

    });
})