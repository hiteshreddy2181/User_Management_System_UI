import React, { useMemo, useState } from 'react';
import {
    MRT_EditActionButtons,
    MaterialReactTable,
    useMaterialReactTable,
} from 'material-react-table';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    QueryClient,
    QueryClientProvider,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import { saveAs } from 'file-saver';

const Example = () => {
    const csvConfig = mkConfig({
        fieldSeparator: ',',
        decimalSeparator: '.',
        useKeysAsHeaders: true,
    });

    const columns = useMemo(
        () => [
            {
                accessorKey: 'id',
                header: 'Id',
                enableEditing: false,
                size: 80,
                muiTableHeadCellProps: {
                    sx: {
                        display: 'none',
                    },
                },
                muiTableBodyCellProps: {
                    sx: {
                        display: 'none',
                    },
                },
            },

            {
                accessorKey: 'username',
                header: 'User Name',
            },
            {
                accessorKey: 'firstname',
                header: 'First Name',
            },
            {
                accessorKey: 'lastname',
                header: 'Last Name',
            },
            {
                accessorKey: 'role',
                header: 'Role',
            },
            {
                accessorKey: 'dateOfAdmission',
                header: 'Date of Admission',
            },
            {
                accessorKey: 'startDate',
                header: 'Start Date',
            }
        ],
        [],
    );
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
    const [applyFormData, setApplyFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        technicalSkills: '',
        location: '',
        yearOfExperience: '',
        resume: null,
    });

    const useApplyForPosition = () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: async (applicationData) => {
                const { data } = await axios.post('http://localhost:5000/recruiter-apply', applicationData);
                return data;
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['positions'] });
            },
        });
    };

    const { mutate: applyForPosition } = useApplyForPosition();

    const handleApplyClose = () => {
        setApplyDialogOpen(false);
        setApplyFormData({
            firstName: '',
            lastName: '',
            email: '',
            technicalSkills: '',
            location: '',
            yearOfExperience: '',
            resume: null,
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setApplyFormData({
            ...applyFormData,
            [name]: value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setApplyFormData({
            ...applyFormData,
            resume: file,
        });
    };

    const handleApplySubmit = () => {
        const formData = new FormData();
        for (const key in applyFormData) {
            formData.append(key, applyFormData[key]);
        }
        formData.append('positionId', selectedPosition.id);
        applyForPosition(formData);
        handleApplyClose();
    };
    const handleApplyOpen = (position) => {
        setSelectedPosition(position);
        setApplyDialogOpen(true);
    };

    const {
        data: fetchedUsers = [],
        isError: isLoadingUsersError,
        isFetching: isFetchingUsers,
        isLoading: isLoadingUsers,
    } = useGetUsers();

    const handleDownload = (pdfData) => {
        const dataArray = new Uint8Array(pdfData.data);
        const blob = new Blob([dataArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Job Description');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportRows = (rows) => {
        const rowData = rows.map((row) => {
            const { JD, ...rest } = row.original;
            return rest;
        });
        const csv = generateCsv(csvConfig)(rowData);
        download(csvConfig)(csv);
    };

    const handleBulkOpen = () => {
        setBulkUploadOpen(true);
    };

    const handleBulkClose = () => {
        setBulkUploadOpen(false);
    };

    const handleCSVDownload = () => {
        const csvContent = `firstName,lastName,email,techskills,location,yearsOfExperience\n`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'template.csv');
    };

    const table = useMaterialReactTable({
        columns,
        data: fetchedUsers,
        createDisplayMode: 'modal',
        editDisplayMode: 'modal',
        showColumnFilters: false,
        showColumnFilters: false,
        enableColumnFilters: false,
        enableColumnFilterModes: false,
        enableColumnActions: false,
        showGlobalFilter: false,
        // enableDensityToggle: false,
        enableEditing: true,
        enableGlobalFilterModes: false,
        enableGlobalFilterRankedResults: false,
        enableRowSelection: false,
        enableRowSelection: true,
        getRowId: (row) => row.id,
        muiToolbarAlertBannerProps: isLoadingUsersError
            ? {
                color: 'error',
                children: 'Error loading data',
            }
            : undefined,
        muiTableContainerProps: {
            sx: {
                minHeight: '500px',
            },
        },
        renderRowActions: ({ row, table }) => (
            <Box sx={{ display: 'flex', gap: '1rem' }}>
                <Tooltip title='Edit'>
                    <Button variant='outlined' onClick={() => handleApplyOpen(row.original)}>
                        Apply
                    </Button>
                </Tooltip>
            </Box>
        ),
        renderTopToolbarCustomActions: ({ table }) => (
            <Box
                sx={{
                    display: 'flex',
                    gap: '16px',
                    padding: '8px',
                    flexWrap: 'wrap',
                }}
            >
                <Tooltip title="Click to download CSV" arrow>
                    <IconButton color="primary" onClick={handleCSVDownload}>
                        <FileDownloadIcon />
                    </IconButton>
                </Tooltip>
                <Button
                    size='small'
                    variant='contained'
                    onClick={() => handleBulkOpen()}
                >
                    Bulk upload
                </Button>
                <Button
                    size='small'
                    disabled={
                        !table.getIsSomeRowsSelected() &&
                        !table.getIsAllRowsSelected()
                    }
                    onClick={() =>
                        handleExportRows(table.getSelectedRowModel().rows)
                    }
                    startIcon={<FileDownloadIcon />}
                >
                    Export Selected Rows
                </Button>
            </Box>
        ),
        initialState: {
            columnPinning: {
                right: ['mrt-row-actions'],
            },
        },
        state: {
            isLoading: isLoadingUsers,
            showAlertBanner: isLoadingUsersError,
            showProgressBars: isFetchingUsers,
        },
    });

    return (
        <>
            <MaterialReactTable table={table} />
            <Dialog open={applyDialogOpen} onClose={handleApplyClose}>
                <DialogTitle>Apply for {selectedPosition?.positionName}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label='First Name'
                                name='firstName'
                                size='small'
                                fullWidth
                                value={applyFormData.firstName}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label='Last Name'
                                name='lastName'
                                size='small'
                                fullWidth
                                value={applyFormData.lastName}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label='Email'
                                name='email'
                                size='small'
                                fullWidth
                                value={applyFormData.email}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label='Technical Skills'
                                name='technicalSkills'
                                size='small'
                                fullWidth
                                value={applyFormData.technicalSkills}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label='Location'
                                name='location'
                                size='small'
                                fullWidth
                                value={applyFormData.location}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label='Year of Experience'
                                name='yearOfExperience'
                                size='small'
                                fullWidth
                                value={applyFormData.yearOfExperience}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button variant='contained' component='label'>
                                Upload Resume
                                <input
                                    type='file'
                                    hidden
                                    onChange={handleFileChange}
                                />
                            </Button>
                            {applyFormData.resume && (
                                <Box mt={1}>
                                    {applyFormData.resume.name}
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleApplyClose} color='secondary'>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApplySubmit}
                        color='primary'
                        variant='contained'
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
};

function useGetUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await fetch('http://localhost:5000/get-jobs', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return response.json();
        },
        refetchOnWindowFocus: false,
    });
}

const queryClient = new QueryClient();

const Admindashboard = () => (
    <>
        <Typography>You are in Admin Dashboard !!!</Typography>
        <QueryClientProvider client={queryClient}>
            <Example />
        </QueryClientProvider>
    </>
);



export default Admindashboard