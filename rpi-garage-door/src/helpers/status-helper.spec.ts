import { DOOR_STATUS } from '../../../shared';
import { getStatus } from './status-helper';

interface IDoorStatusTest {
    open: boolean;
    closed: boolean;
    expected: DOOR_STATUS;
    current?: DOOR_STATUS;
}

describe('status-helper', () => {
    describe('getStatus', () => {
        const tests: IDoorStatusTest[] = [
            { open: false, closed: false, expected: 'UNKNOWN' },
            { open: true, closed: true, expected: 'UNKNOWN' },
            { open: true, closed: false, expected: 'OPEN' },
            { open: false, closed: true, expected: 'CLOSED' },
            { open: false, closed: false, current: 'CLOSING', expected: 'CLOSING' },
            { open: false, closed: false, current: 'OPENING', expected: 'OPENING' },
            { open: false, closed: false, current: 'UNKNOWN', expected: 'UNKNOWN' },
            { open: false, closed: false, current: 'OPEN', expected: 'UNKNOWN' },
            { open: false, closed: false, current: 'CLOSED', expected: 'UNKNOWN' },
        ];

        tests.forEach((test) => {
            it(`should return '${test.expected}' when door open is ${test.open}, door closed is ${test.closed} and current is '${test.current}'`, () => {
                expect(getStatus(test.open, test.closed, test.current)).toEqual(test.expected);
            });
        });
    });
});
