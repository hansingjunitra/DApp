import { useEffect, useState, useCallback } from 'react';
import {
  Tab,
  Tabs,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  CircularProgress,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import debounce from 'lodash/debounce';
import { useContract, useWeb3 } from '@services/contract/web3';
import { useMetamask, getAddressFromMetamask } from '@services/metamask';
import { Certificate } from '@param/certificate';

const FORM_FIELDS: { label: string; name: string }[] = [
  {
    name: 'name',
    label: 'Recipient Name',
  },
  {
    name: 'course',
    label: 'Course',
  },
  {
    name: 'degree',
    label: 'Degree',
  },
  {
    name: 'enrolledYear',
    label: 'Enrolled Year',
  },
  {
    name: 'graduatingYear',
    label: 'Graduating Year',
  },
  {
    name: 'recipient',
    label: 'Recipient Address',
  },
];

const University: Function = () => {
  const [accountAddress, setAccountAddress] = useState('');
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<boolean | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [loading, setLoading] = useState(false);

  const [certificate, setCertificate] = useState<Certificate>({
    name: '',
    course: '',
    degree: '',
    graduatingYear: '',
    enrolledYear: '',
    recipient: '',
  });

  const web3Ref = useWeb3();
  const contractRef = useContract(web3Ref.current);
  const [metamaskEnabled, metamaskConnect] = useMetamask(web3Ref.current);

  const validateAddress = useCallback(
    debounce((addr: string) => {
      setError(!web3Ref.current.utils.isAddress(addr));
    }, 200),
    []
  );
  useEffect(() => {
    if (accountAddress) validateAddress(accountAddress);
  }, [accountAddress, validateAddress]);

  const inputChangeHandler = (evt: any) => {
    const value = evt.target.value;
    setCertificate({
      ...certificate,
      [evt.target.name]: value,
    });
  };

  const setAddressFromMetamask = async () => {
    const addr = await getAddressFromMetamask();
    setAccountAddress(addr);
  };

  const issueCertificate = async () => {
    if (!web3Ref.current.utils.isAddress(accountAddress)) {
      setError(true);
      return;
    }
    setLoading(true);
    // console.log(certificate, accountAddress);
    try {
      web3Ref.current.eth.defaultAccount = accountAddress;
      contractRef.current.defaultAccount = accountAddress;
      const result = await contractRef.current.methods
        .issueCertificate(
          certificate.name,
          certificate.course,
          certificate.degree,
          certificate.graduatingYear,
          certificate.enrolledYear,
          certificate.recipient
        )
        .send({ from: accountAddress, gas: 3000000 });
      console.log(result);
      if (result.status !== null && result.status) {
        setStatus(true);
      } else {
        setStatus(false);
      }
      setShowVerify(true);
    } catch (err) {
      console.error(err);
      setStatus(false);
      setShowVerify(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h4" style={{ margin: '16px 0px' }}>
          University Main Page
        </Typography>
        <TextField
          label="Wallet Address"
          placeholder="Get address from Metamask"
          value={accountAddress}
          error={error}
          helperText={error ? 'Invalid Address' : ''}
          InputProps={{ readOnly: true }}
          variant="outlined"
          fullWidth
          style={{ width: '500px' }}
        />
      </Box>
      <Box mb={4}>
        <Box mb={1}>
          <Button
            onClick={metamaskEnabled ? setAddressFromMetamask : metamaskConnect}
            color="secondary"
            variant="contained"
          >
            {metamaskEnabled ? 'Import from Metamask' : 'Use Metamask'}
          </Button>
        </Box>
      </Box>
      {showVerify && (
        <Box mb={2} mx="auto" width="50%">
          {status ? (
            <Alert severity="success">
              Certificate Issued to {certificate.name}!
            </Alert>
          ) : (
            <Alert severity="error">Error in issuing certificate!</Alert>
          )}
        </Box>
      )}
      <Box mb={2} m="auto" width="50%">
        <Box mb={2}>
          {FORM_FIELDS.map(({ name, label }) => {
            return (
              <TextField
                name={name}
                label={label}
                variant="outlined"
                fullWidth
                onChange={inputChangeHandler}
                style={{ marginBottom: '0.75rem' }}
                disabled={loading}
                key={name}
              />
            );
          })}
        </Box>
      </Box>
      <Box mb={4}>
        <Box mb={1} style={{ position: 'relative' }}>
          <Button
            onClick={issueCertificate}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            Issue Certificate
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export { University };
