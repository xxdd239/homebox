import React from 'react'
import { $talc } from '../styles/utils'
import styled from '@emotion/styled'
import { Var, ThemeVar } from '../styles/variable'

const FooterContainer = styled.div`
  ${$talc}
  color: ${Var(ThemeVar.FooterColor)};
  padding-top: 24px;
`

export function Footer() {
  return (
    <FooterContainer>
                             XPON-TEST 2024
    </FooterContainer>
  )
}
