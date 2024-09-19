import React, { useEffect, useState } from 'react'
import { $talc } from '../styles/utils'
import styled from '@emotion/styled'
import { Var, ThemeVar } from '../styles/variable'

const FooterContainer = styled.div`
  ${$talc}
  color: ${Var(ThemeVar.FooterColor)};
  padding-top: 24px;
`

export function Footer() {
  const [ip, setIp] = useState('');

  useEffect(() => {
    const getLocalIP = () => {
      const peerConnection = new RTCPeerConnection();
      peerConnection.createDataChannel('');
      peerConnection.createOffer().then(offer => peerConnection.setLocalDescription(offer));

      peerConnection.onicecandidate = (event) => {
        if (event && event.candidate && event.candidate.candidate) {
          const candidate = event.candidate.candidate;
          const ipMatch = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
          if (ipMatch) {
            setIp(ipMatch[0]);
          }
        }
      };
    };

    getLocalIP();
  }, []);

  return (
    <FooterContainer>
      <div>XPON-TEST 2024916</div>
      <div>客户端IP: {ip ? ip : 'Fetching IP...'}</div>
    </FooterContainer>
  );
}
