// @flow
import * as SignupGen from '../../../actions/signup-gen'
import DeviceName from '.'
import {connect, type TypedState} from '../../../util/container'

const mapStateToProps = (state: TypedState) => ({
  deviceName: state.signup.devicename,
  error: state.signup.devicenameError,
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onBack: () => dispatch(SignupGen.createRestartSignup()),
  onSubmit: (devicename: string) => dispatch(SignupGen.createSubmitDevicename({devicename})),
})

export default connect(mapStateToProps, mapDispatchToProps)(DeviceName)
