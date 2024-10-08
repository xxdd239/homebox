import { SpeedIndicator } from './speed-indicator'
import styled from '@emotion/styled'
import { useState, useContext } from 'react'
import { useRates } from '../hooks'
import { ChannelsContext, ConfigContext } from '../context'
import { zip, interval } from 'rxjs'
import { rateFormatters } from '../utils'
import { Button, Intent } from '@blueprintjs/core'
import { $textCenter, $mgt } from '../styles/utils'
import { css } from '@emotion/react'
import { take, mergeMap } from 'rxjs/operators'
import { ping } from '../cases/ping'
import { showToast } from '../toaster'

const $Header = styled.div`
  display: flex;
`

const $HeaderCase = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  text-align: center;
`

const $CaseTitle = styled.div``
const $CaseContent = styled.div`
  font-size: 24px;
  font-weight: bold;
`

enum RunningStep {
  NONE = 1,
  PING,
  DOWNLOAD,
  UPLOAD,
  DONE,
}

const RunningStepLabels: Record<RunningStep, string> = {
  [RunningStep.NONE]: '开始测速',
  [RunningStep.DOWNLOAD]: '下行测试中...',
  [RunningStep.PING]: 'Ping...',
  [RunningStep.UPLOAD]: '上行测试中...',
  [RunningStep.DONE]: '再次测速',
}

export function RunCaseOnce() {
  const [dlRate, setDlRate] = useState(-1)
  const [ulRate, setUlRate] = useState(-1)
  const [ttl, pushTTL, clearTTL] = useRates(5)
  const [step, setStep] = useState(RunningStep.NONE)
  const createChannels = useContext(ChannelsContext)
  const { duration, parallel, packCount, unit } = useContext(ConfigContext)

  const _start = async () => {
    clearTTL()
    setStep(RunningStep.PING)
    await interval(300)
      .pipe(
        take(10),
        mergeMap(() => ping()),
      )
      .forEach((v) => {
        pushTTL(v)
      })
    const channels = await createChannels()

    setStep(RunningStep.DOWNLOAD)
    await zip(
      ...channels.map((channel) =>
        channel.observe('download', {
          duration,
          packCount,
          parallel,
          interval: 300,
        }),
      ),
    ).forEach((v) => {
      setDlRate(v.reduce((a, b) => a + b, 0))
    })

    setStep(RunningStep.UPLOAD)

    await zip(
      ...channels.map((channel) =>
        channel.observe('upload', {
          duration,
          packCount,
          parallel,
          interval: 300,
        }),
      ),
    ).forEach((v) => {
      setUlRate(v.reduce((a, b) => a + b, 0))
    })

    setStep(RunningStep.DONE)
  }

  const start = () => {
    _start().catch(err => {
      showToast({
        message: `Error, Please check environment`,
        intent: Intent.DANGER,
        icon: "warning-sign",
      })
      setStep(RunningStep.DONE)
    })
  }

  return (
    <div>
      <$Header>
        <$HeaderCase>
          <$CaseTitle>延迟</$CaseTitle>
          <$CaseContent>{step >= RunningStep.PING ? `${ttl.toFixed(2)} ms` : '--'}</$CaseContent>
        </$HeaderCase>

        <$HeaderCase>
          <$CaseTitle>下行速率</$CaseTitle>
          <$CaseContent>{step >= RunningStep.DOWNLOAD ? rateFormatters[unit](dlRate) : '--'}</$CaseContent>
        </$HeaderCase>

        <$HeaderCase>
          <$CaseTitle>上行速率</$CaseTitle>
          <$CaseContent>{step >= RunningStep.UPLOAD ? rateFormatters[unit](ulRate) : '--'}</$CaseContent>
        </$HeaderCase>
      </$Header>
      <SpeedIndicator
        speed={step === RunningStep.DOWNLOAD ? dlRate : step === RunningStep.UPLOAD ? ulRate : undefined}
        running={step !== RunningStep.DONE && step !== RunningStep.NONE}
      />
      <div css={css`${$textCenter}${$mgt[4]}`}>
        <Button onClick={start} disabled={step !== RunningStep.NONE && step !== RunningStep.DONE}>
          {RunningStepLabels[step]}
        </Button>
      </div>
    </div>
  )
}
