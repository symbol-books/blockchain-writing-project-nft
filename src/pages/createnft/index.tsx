import React, { useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import { Box, Typography, Button, Backdrop, CircularProgress, TextField } from '@mui/material';
import {createNFTTransaction} from '@/utils/createNFTTransaction';
import {sendTransactionWithSSS} from '@/utils/sendTransactionWithSSS';
import { AggregateTransaction, MosaicId, Transaction, TransactionStatus } from 'symbol-sdk';

//SSS用設定
interface SSSWindow extends Window {
  SSS: any
}

function CreateNFT(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogTitle, setDialogTitle] = useState<string>(''); //AlertsDialogの設定(共通)
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)
  const [hash, setHash] = useState<string>('');
  const [mosaicId, setMosaicId] = useState<string>('');

//   NFTのメタデータ（ERC-721準拠）
  const [name, setName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  //ページ個別設定
  const [openDialogGetAddress, setOpenDialogGetAddress] = useState<boolean>(false); //AlertsDialogの設定(個別)
  const handleAgreeClickGetAddress = async () => {
    try {
        setProgress(true);
        const clientPublickey = window.SSS.activePublicKey;
        const transaction: {transaction:Transaction, mosaicId:MosaicId} = createNFTTransaction(name, imageUrl, description, clientPublickey);
        setMosaicId(transaction.mosaicId.toHex())
        const transactionStatus: TransactionStatus | undefined = await sendTransactionWithSSS(transaction.transaction);
        if (transactionStatus === undefined) {
          setSnackbarSeverity('error');
          setSnackbarMessage('NODEの接続に失敗しました');
          setOpenSnackbar(true);
        } else if (transactionStatus.code === 'Success') {
          setHash(transactionStatus.hash);
          setSnackbarSeverity('success');
          setSnackbarMessage(`${transactionStatus.group} TXを検知しました`);
          setOpenSnackbar(true);
        } else {
          setSnackbarSeverity('error');
          setSnackbarMessage(`TXに失敗しました ${transactionStatus.code}`);
          setOpenSnackbar(true);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setProgress(false);
      }
  };

  return (
    <>
      <Header setOpenLeftDrawer={setOpenLeftDrawer} />
      <LeftDrawer openLeftDrawer={openLeftDrawer} setOpenLeftDrawer={setOpenLeftDrawer} />
      <AlertsSnackbar
        openSnackbar={openSnackbar}
        setOpenSnackbar={setOpenSnackbar}
        vertical={'bottom'}
        snackbarSeverity={snackbarSeverity}
        snackbarMessage={snackbarMessage}
      />
      <AlertsDialog
        openDialog={openDialogGetAddress}
        setOpenDialog={setOpenDialogGetAddress}
        handleAgreeClick={() => {
          handleAgreeClickGetAddress();
          setOpenDialogGetAddress(false);
        }}
        dialogTitle={dialogTitle}
        dialogMessage={dialogMessage}
      />
      {progress ? (
        <Backdrop open={progress}>
          <CircularProgress color='inherit' />
        </Backdrop>
      ) : (
        <Box
          sx={{ p: 1}}
          display='flex'
          alignItems='center'
          justifyContent='center'
          flexDirection='column'
        >
          <Typography component='div' variant='h6' sx={{ mt: 5, mb: 5 }}>
            NFTの発行
          </Typography>
          <TextField id="outlined-basic" label="名前" variant="outlined" value={name} onChange={(e)=>{setName(e.target.value)}} sx={{ mt: 1, mb: 1 , width:"40%", minWidth:300}}/>
          <TextField id="outlined-basic" label="画像ファイルのURL" variant="outlined" value={imageUrl} onChange={(e)=>{setImageUrl(e.target.value)}} sx={{ mt: 1, mb: 1, width:"40%", minWidth:300}}/>
          <TextField id="outlined-basic" label="説明" multiline rows={3} variant="outlined" value={description} onChange={(e)=>{setDescription(e.target.value)}} sx={{ mt: 1, mb: 1, width:"40%", minWidth:300}}/>
          <Button
            color='primary'
            variant='contained'
            onClick={() => {
              setDialogTitle('発行確認');
              setDialogMessage('入力した情報でNFTを発行しますか？');
              setOpenDialogGetAddress(true);
            }}
          >
            発行
          </Button>

          {hash !== '' ? (
            <React.Fragment>
              <Typography component='div' variant='body1' sx={{ mt: 5, mb: 1 }}>
              {`モザイクID : ${mosaicId}`}
              </Typography>
              <Typography
                component='div'
                variant='body1'
                sx={{ mt: 5, mb: 1 }}
                onClick={() => {
                  window.open(`https://testnet.symbol.fyi/transactions/${hash}`, '_blank');
                }}
              >
                {`hash値 : ${hash}`}
              </Typography>
            </React.Fragment>
          ) : (
            <></>
          )}
        </Box>
      )}
    </>
  );
}
export default CreateNFT;
