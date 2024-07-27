import React from 'react'
import { Modal, Button, Stack, Text } from '@mantine/core';
import { sendMessageToBackground } from './common';
import { Command } from './types';

/**
 *
 */
export function SignInModal(props: any) {

    function signIn() {
        sendMessageToBackground(Command.SignIn);
        props.close();
    }

    return (<>
        <Modal opened={props.opened} onClose={props.close} title="Sign In Required" centered>
            <Stack align="stretch" justify="center" gap="md">
                <Text>
                    To report a profile, you must be signed in.
                </Text>

               <Button onClick={signIn}>Sign In</Button>
            </Stack>
        </Modal>
    </>);
}
