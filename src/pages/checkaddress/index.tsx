import React, { useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import { Box, Typography, Button, Backdrop, CircularProgress, TextField, Card, CardHeader, CardMedia, CardContent, Grid} from '@mui/material';

import {getAccountNft} from '@/utils/getAccountNft';


interface NFT {
  mosaicId:string,
  name: string,
  imageUrl:string,
  description:string
}

function createMosaic(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogTitle, setDialogTitle] = useState<string>(''); //AlertsDialogの設定(共通)
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)
  const [address, setAddress] = useState<string>('');

//   NFTのメタデータ（ERC-721準拠）
  const [nfts, setNfts] = useState<NFT[] | []>([]);

 

  //ページ個別設定
  const [openDialogGetAddress, setOpenDialogGetAddress] = useState<boolean>(false); //AlertsDialogの設定(個別)
  const handleAgreeClickGetAddress = async () => {
    try {
        setProgress(true);

        const mosaicInfo = await getAccountNft(address);
        if(typeof(mosaicInfo)!=="undefined"){
          setNfts(mosaicInfo);
        }
        setSnackbarSeverity('success');
        setSnackbarMessage('NFTの取得に成功しました');

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
          sx={{ p: 1 }}
          display='flex'
          alignItems='center'
          justifyContent='center'
          flexDirection='column'
        >
          <Typography component='div' variant='h6' sx={{ mt: 5, mb: 2 }}>
            アドレスの保有するNFTの確認
          </Typography>
          <TextField id="outlined-basic" label="アドレス" variant="outlined" value={address} onChange={(e)=>{setAddress(e.target.value)}} sx={{ mt: 1, mb: 2 , width:"40%", minWidth:300}}/>
          <Button
            color='primary'
            variant='contained'
            onClick={() => {
                setDialogTitle('確認');
                setDialogMessage('入力した情報でアドレスのNFTを確認しますか？');
                setOpenDialogGetAddress(true);
            }}
          >
            確認
          </Button>
          <Grid container alignItems="center" justifyContent="center">
          {nfts.length>0&&
                nfts.map((item: NFT, index) => (
                  
                <Card sx={{maxWidth:230, m:2}}>
                <CardHeader
                    title={item.name}
                    subheader={"ID: "+item.mosaicId}
                />
                <CardMedia
                    sx={{height:100, pt:"5%",pb:"5%"}}
                    component="img"
                    image={item.imageUrl}
                />
                <CardContent>
                <Typography variant="body2" color="textSecondary" component="p">
                    {item.description}
                </Typography>
                </CardContent>
            </Card>
            ))}
          </Grid>
          
        </Box>
      )}
    </>
  );
}


export default createMosaic;
