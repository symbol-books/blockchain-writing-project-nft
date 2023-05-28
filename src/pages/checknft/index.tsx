import React, { useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import { Box, Typography, Button, Backdrop, CircularProgress, TextField, Card, CardContent, CardHeader, CardMedia, Grid } from '@mui/material';
import {getMosaicInfo} from '@/utils/getMosaicInfo';
import {KeyGenerator} from 'symbol-sdk';

function createMosaic(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogTitle, setDialogTitle] = useState<string>(''); //AlertsDialogの設定(共通)
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)
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
        const nameKey = KeyGenerator.generateUInt64Key('NAME').toHex();
        const imageUrlKey = KeyGenerator.generateUInt64Key('IMAGE').toHex();
        const descriptionKey = KeyGenerator.generateUInt64Key('DESCRIPTION').toHex();
        const mosaicInfo = await getMosaicInfo(mosaicId);

        const nameInfo = mosaicInfo?.metadata.find(item=>item.metadataEntry.scopedMetadataKey.toHex() === nameKey);
        const imageUrlInfo = mosaicInfo?.metadata.find(item=>item.metadataEntry.scopedMetadataKey.toHex() === imageUrlKey);
        const descriptionInfo = mosaicInfo?.metadata.find(item=>item.metadataEntry.scopedMetadataKey.toHex() === descriptionKey);
        if(typeof(nameInfo) === 'undefined' || typeof(imageUrlInfo) === 'undefined'|| typeof(descriptionInfo) === 'undefined') throw new Error('メタデータが不正です');
        setName(nameInfo?.metadataEntry.value);
        setImageUrl(imageUrlInfo?.metadataEntry.value);
        setDescription(descriptionInfo?.metadataEntry.value);
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
          <Typography component='div' variant='h6' sx={{ mt: 5, mb: 5 }}>
            発行されたNFTの確認
          </Typography>
          <TextField id="outlined-basic" label="モザイクID" variant="outlined" value={mosaicId} onChange={(e)=>{setMosaicId(e.target.value)}} sx={{ mt: 5, mb: 2 }}/>
          <Button
            color='primary'
            variant='contained'
            onClick={() => {
                setDialogTitle('確認');
                setDialogMessage('入力した情報でNFTを確認しますか？');
                setOpenDialogGetAddress(true);
            }}
          >
            確認
          </Button>

          {name !== '' ? (
          <Grid container alignItems="center" justifyContent="center">
                  
            <Card sx={{maxWidth:230, m:2}}>
                <CardHeader
                    title={name}
                    subheader={"ID: "+mosaicId}
                />
                <CardMedia
                    sx={{height:100, pt:"5%",pb:"5%"}}
                    component="img"
                    image={imageUrl}
                />
                <CardContent>
                <Typography variant="body2" color="textSecondary" component="p">
                    {description}
                </Typography>
                </CardContent>
            </Card>

          </Grid>
          ) : (
            <></>
          )}
          
        </Box>
      )}
    </>
  );
}


export default createMosaic;
