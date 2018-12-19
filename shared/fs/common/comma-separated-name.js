// @flow
import * as React from 'react'
import * as Styles from '../../styles'
import * as Kb from '../../common-adapters'
import {type TextType} from '../../common-adapters/text'

export type Props = {
  name: string,
  elementStyle?: ?Styles.StylesCrossPlatform,
  type: TextType,
  selectable?: boolean,
}

// We are splitting on ',' here, so it won't work for
// long names that don't have comma. If this becomes a
// problem, we might have to do smarter splitting that
// involve other characters, or just break the long name
// apart into 3-character groups.
export default (props: Props) =>
  props.name.split(',').map<React.Node>((elem, idx, {length}: Array<string>) => (
    <Kb.Text selectable={props.selectable} key={idx.toString()} type={props.type} style={props.elementStyle}>
      {elem}
      {idx !== length - 1 ? ',' : ''}
    </Kb.Text>
  ))
