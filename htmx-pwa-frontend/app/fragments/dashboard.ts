import type { Element } from '../../lib/types';

export const Dashboard = (authToken: string): Element => {
  return {
    type: 'section',
    shape: {
      children: [
        { type: 'h1', shape: { children: ["If you're here, signin worked."] } },
        { type: 'p', shape: { children: ['Yay'] } },
      ],
    },
    // behavior: {
    //   resource: { action: 'get', url: '/dashboard' },
    //   onTriggered: async (event) => {
    //     fetch('/whoami');

    //     return {
    //       type: 'section',
    //       shape: {
    //         children: [
    //           { type: 'h1', shape: { children: ["If you're here, signin worked."] } },
    //           { type: 'p', shape: { children: [`Hello user ${email}`] } },
    //         ],
    //       },
    //     };
    //   },
    //   swap: 'outerHTML',
    // },
  };
};
