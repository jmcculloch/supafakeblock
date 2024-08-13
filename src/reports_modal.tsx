import React from 'react'
import { Modal, Table } from '@mantine/core';
import { Report } from './types';
import { emojiForReportType } from './common';

/**
 *
 */
export function ReportsModal(props: ReportsModalProps) {
    const rows = props.reports.map((report) => (
        <Table.Tr>
            <Table.Td>{report.createdAt}</Table.Td>
            <Table.Td>{report.dispute ? '👎' : '👍'}</Table.Td>
            <Table.Td>{emojiForReportType(report.type)} {report.type}</Table.Td>
            <Table.Td>{report.confidence}</Table.Td>
            <Table.Td>{report.notes ?? ''}</Table.Td>
        </Table.Tr>
    ));
    return (<>
        <Modal opened={props.opened} onClose={props.close} title="Previous Reports" centered zIndex={300} size="xl">
            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Up/Down</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Confidence</Table.Th>
                        <Table.Th>Notes</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Modal>
    </>);
}

interface ReportsModalProps {
    opened: boolean;
    close: () => void;
    reports: Report[]
}
  