// @flow
import * as React from 'react'
import {type DeviceType} from '../../constants/types/devices'
import {Confirm, Box, Text, Icon, ProgressIndicator, type IconType} from '../../common-adapters'
import {
  globalColors,
  globalMargins,
  globalStyles,
  styleSheetCreate,
  isMobile,
  platformStyles,
} from '../../styles'

export type Props = {
  currentDevice: boolean,
  deviceID: string,
  endangeredTLFs: Array<string>,
  type: DeviceType,
  name: string,
  onCancel: () => void,
  onSubmit: () => void,
  waiting: boolean,
}

const Header = ({name, type}: {name: string, type: DeviceType}) => {
  const icon: IconType = {
    backup: isMobile ? 'icon-paper-key-revoke-64' : 'icon-paper-key-revoke-48',
    desktop: isMobile ? 'icon-computer-revoke-64' : 'icon-computer-revoke-48',
    mobile: isMobile ? 'icon-phone-revoke-64' : 'icon-phone-revoke-48',
  }[type]
  return (
    <Box style={styles.header}>
      <Icon type={icon} />
      <Text type="BodySemibold" style={styles.name}>
        {name}
      </Text>
    </Box>
  )
}

const Body = (props: {
  endangeredTLFs: Array<string>,
  name: string,
  currentDevice: boolean,
  waiting: boolean,
}) => (
  <Box>
    <Box style={styles.bodyHeader}>
      <Text type="BodySemibold">Are you sure you want to revoke </Text>
      {props.currentDevice ? (
        <Text type="BodySemibold">your current device</Text>
      ) : (
        <Text type="BodySemiboldItalic">{props.name}</Text>
      )}
      <Text type="BodySemibold">?</Text>
    </Box>

    {props.waiting ? (
      <ProgressIndicator />
    ) : (
      props.endangeredTLFs.length > 0 && (
        <Box>
          <Box>
            <Text type="Body">You may lose access to these folders forever:</Text>
          </Box>

          <Box style={styles.container}>
            {props.endangeredTLFs.map(tlf => (
              <Box key={tlf} style={styles.TLF}>
                <Text type="BodySemibold" style={{marginRight: globalMargins.tiny}}>
                  •
                </Text>
                <Text type="BodySemibold" selectable={true}>
                  {tlf}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      )
    )}
  </Box>
)

const DeviceRevoke = (props: Props) => (
  <Confirm
    body={
      <Body
        endangeredTLFs={props.endangeredTLFs}
        name={props.name}
        currentDevice={props.currentDevice}
        waiting={props.waiting}
      />
    }
    danger={true}
    header={<Header name={props.name} type={props.type} />}
    onCancel={props.onCancel}
    onSubmit={props.waiting ? null : props.onSubmit}
    disabled={!!props.waiting}
    submitLabel="Yes, delete it"
    theme="public"
  />
)

const styles = styleSheetCreate({
  header: {
    ...globalStyles.flexBoxColumn,
    alignItems: 'center',
  },
  bodyHeader: {
    marginBottom: globalMargins.tiny,
  },
  TLF: {
    marginBottom: globalMargins.xtiny,
  },
  name: {
    color: globalColors.red,
    fontStyle: 'italic',
    marginTop: 4,
    textDecorationLine: 'line-through',
  },
  container: platformStyles({
    common: {
      ...globalStyles.flexBoxColumn,
      alignItems: 'flex-start',
      alignSelf: 'center',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: globalColors.black_05,
      borderRadius: 4,
      height: 162,
      marginBottom: globalMargins.small,
      marginTop: globalMargins.small,
      padding: globalMargins.small,
      width: 440,
    },
    isElectron: {
      overflowY: 'scroll',
    },
  }),
})

export default DeviceRevoke
