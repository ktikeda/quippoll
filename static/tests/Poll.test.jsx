import React from 'react';
import Poll from '../js/Poll';
import ShallowRenderer from 'react-test-renderer/shallow';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import 'isomorphic-fetch';

Enzyme.configure({ adapter: new Adapter() })

const pollProps = {
  "pollId": "5",
  "routeProps": {
    "match": {
      "path": "/questions",
      "url": "/questions",
      "isExact": true,
      "params": {}
    },
    "location": {
      "pathname": "/questions",
      "search": "",
      "hash": "",
      "key": "ufemmq"
    },
    "history": {
      "length": 16,
      "action": "POP",
      "location": {
        "pathname": "/questions",
        "search": "",
        "hash": "",
        "key": "ufemmq"
      }
    }
  },
  "mode": "respond",
  "userId": 3,
  "isAdmin": true,
  "mayRespond": true,
  "pollType": "ranked questions",
  "collectResponse": true,
  "collectTally": true,
  "multiSelect": true,
  "title": "Questions",
  "prompt": "Ask me anything.",
  "shortCode": "questions"
};

it('renders poll shallow correctly', () => {
  const renderer = new ShallowRenderer();
  renderer.render(<Poll {...pollProps} />);
  const tree = renderer.getRenderOutput();
  console.log(tree);
  console.log(tree.toString());
  expect(tree).toMatchSnapshot();
}
);

it ('renders poll shallow enzyme correctly', () => {
  const wrapper = shallow(<Poll {...pollProps} />);
  console.log(wrapper);
  console.log(wrapper.debug());
});