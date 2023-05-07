import React, { useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import axios from 'axios';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import { Box, Typography, Button, Backdrop, CircularProgress } from '@mui/material';
import { AdminAddress, ClientAddress } from '@/globalState/atoms';
import { useRecoilValue } from 'recoil';

function Page4(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogTitle, setDialogTitle] = useState<string>(''); //AlertsDialogの設定(共通)
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)

  //ページ個別設定
  const [hash, setHash] = useState<string>('');
  const clientAddress = useRecoilValue(ClientAddress);
  const adminAddress = useRecoilValue(AdminAddress);
  const [openDialogSendMessage, setOpenDialogSendMessage] = useState<boolean>(false); //AlertsDialogの設定(個別)
  const handleAgreeClickSendMessage = () => {
    //AlertsDialogの設定(個別)
    if (clientAddress === '') {
      //事前チェック
      setSnackbarSeverity('error');
      setSnackbarMessage('クライアントのアカウントを作成して下さい');
      setOpenSnackbar(true);
      return;
    }
    if (adminAddress === '') {
      //事前チェック
      setSnackbarSeverity('error');
      setSnackbarMessage('管理者のアドレスを確認して下さい');
      setOpenSnackbar(true);
      return;
    }
    if (false) {
      //事前チェック
      setSnackbarSeverity('error');
      setSnackbarMessage('クライアント側に手数料分のxymを送金して下さい');
      setOpenSnackbar(true);
      return;
    }

    // const [privatekey, publickey, address] = sendMessage(clientAddress,adminAddress);
    setHash('');
    setSnackbarSeverity('success');
    setSnackbarMessage('メッセージの送信に成功しました');
    setOpenSnackbar(true);
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
        openDialog={openDialogSendMessage}
        setOpenDialog={setOpenDialogSendMessage}
        handleAgreeClick={() => {
          handleAgreeClickSendMessage();
          setOpenDialogSendMessage(false);
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
          sx={{ p: 3 }}
          display='flex'
          alignItems='center'
          justifyContent='center'
          flexDirection='column'
        >
          <Typography component='div' variant='h6' sx={{ mt: 5, mb: 1 }}>
            クライアントから管理者へメッセージ送信
          </Typography>
          <Typography component='div' variant='caption' sx={{ mt: 1, mb: 5 }}>
            * クライアント側での承認トランザクション検知処理を行います
          </Typography>
          <Button
            color='primary'
            variant='contained'
            onClick={() => {
              setDialogTitle('メッセージ送信');
              setDialogMessage('クライアントへ管理者へメッセージを送信しますか？');
              setOpenDialogSendMessage(true);
            }}
          >
            送信
          </Button>
          {hash !== '' ? (
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
          ) : (
            <></>
          )}
        </Box>
      )}
    </>
  );
}
export default Page4;
