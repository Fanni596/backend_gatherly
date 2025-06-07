import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiEdit, FiTrash, FiPlus, FiX, FiUpload, FiDownload,
    FiChevronLeft, FiCheck, FiUser, FiPhone, FiMail, FiSearch,
    FiFilter, FiDollarSign, FiUsers, FiInfo
} from 'react-icons/fi';
import {
    CircularProgress,
    Backdrop,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Checkbox,
    Typography,
    TableContainer,
    IconButton,
    DialogContentText,
    Menu,
    MenuItem,
    Divider,
    Tooltip,
    Paper,
    Chip,
    Avatar,
    FormControlLabel,
    Switch,
    Box,
    Tab,
    Tabs,
    Badge,
    InputAdornment,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import * as XLSX from 'xlsx';

// Simple styled components for enhanced UI
const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : 'rgba(0, 0, 0, 0.02)',
    },
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
}));

const AttendeesPage = () => {
    const { listId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [attendees, setAttendees] = useState([]);
    const [listDetails, setListDetails] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [modals, setModals] = useState({
        create: false,
        edit: false,
        delete: false,
        import: false,
        bulkEdit: false
    });
    const [selectedAttendees, setSelectedAttendees] = useState([]);
    const [newAttendee, setNewAttendee] = useState({
        FirstName: '',
        LastName: '',
        Email: '',
        Phone: '',
        ListId: listId,
        AllowedPeople: 1,
        IsPaying: false,
    });
    const [editAttendee, setEditAttendee] = useState({
        Id: null,
        FirstName: '',
        LastName: '',
        Email: '',
        Phone: '',
        ListId: listId,
        AllowedPeople: 1,
        IsPaying: false,
    });
    const [bulkEditField, setBulkEditField] = useState('');
    const [bulkEditValue, setBulkEditValue] = useState('');
    const [parsedAttendees, setParsedAttendees] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [anchorEl, setAnchorEl] = useState(null);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'FirstName',
        direction: 'ascending',
    });
    const [tabValue, setTabValue] = useState(0);
    const [stats, setStats] = useState({
        total: 0,
        paying: 0,
        nonPaying: 0,
        totalAllowed: 0
    });

    // Calculate stats whenever attendees change
    useEffect(() => {
        if (attendees.length > 0) {
            const paying = attendees.filter(a => a.IsPaying).length;
            const totalAllowed = attendees.reduce((sum, a) => sum + a.AllowedPeople, 0);
            
            setStats({
                total: attendees.length,
                paying,
                nonPaying: attendees.length - paying,
                totalAllowed
            });
        } else {
            setStats({
                total: 0,
                paying: 0,
                nonPaying: 0,
                totalAllowed: 0
            });
        }
    }, [attendees]);

    // Filter and sort attendees
    const filteredAndSortedAttendees = useMemo(() => {
        let filteredAttendees = [...attendees];

        // Apply payment filter
        if (filterPaymentStatus !== 'all') {
            const isPaying = filterPaymentStatus === 'paying';
            filteredAttendees = filteredAttendees.filter(attendee => attendee.IsPaying === isPaying);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredAttendees = filteredAttendees.filter(attendee =>
                attendee.FirstName.toLowerCase().includes(term) ||
                attendee.LastName.toLowerCase().includes(term) ||
                (attendee.Email && attendee.Email.toLowerCase().includes(term)) ||
                attendee.Phone.includes(term)
            );
        }

        // Apply sorting
        if (sortConfig.key) {
            filteredAttendees.sort((a, b) => {
                // Handle null values
                if (a[sortConfig.key] === null) return 1;
                if (b[sortConfig.key] === null) return -1;
                
                // Handle string comparison
                if (typeof a[sortConfig.key] === 'string') {
                    return sortConfig.direction === 'ascending' 
                        ? a[sortConfig.key].localeCompare(b[sortConfig.key])
                        : b[sortConfig.key].localeCompare(a[sortConfig.key]);
                }
                
                // Handle number comparison
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredAttendees;
    }, [attendees, searchTerm, sortConfig, filterPaymentStatus]);

    // Handle sort request
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Get sort indicator for table headers
    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };

    useEffect(() => {
        fetchListDetails();
        fetchAttendees();
    }, [listId]);

    const fetchListDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                import.meta.env.VITE_API_BASE_URL+`/organizer/Attendees/getlistdetails:${listId}`,
                { withCredentials: true }
            );
            setListDetails({
                name: response.data.name,
                description: response.data.description,
            });
        } catch (error) {
            showSnackbar('Failed to fetch list details. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendees = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                import.meta.env.VITE_API_BASE_URL+`/organizer/Attendees/getall?listId=${listId}`,
                { withCredentials: true }
            );
            setAttendees(Array.isArray(response.data) ? response.data : []);
            setSelectedAttendees([]);
        } catch (error) {
            showSnackbar('Failed to fetch attendees. Please try again.', 'error');
            setAttendees([]);
        } finally {
            setLoading(false);
        }
    };

    const validateAttendee = (attendee) => {
        const errors = {};
        if (!attendee.FirstName.trim()) errors.FirstName = 'First name is required';
        if (!attendee.LastName.trim()) errors.LastName = 'Last name is required';
        if (attendee.Email && !/^\S+@\S+\.\S+$/.test(attendee.Email)) {
            errors.Email = 'Invalid email format';
        }
        if (!attendee.Phone.trim()) errors.Phone = 'Phone is required';
        else if (!/^[0-9]{10,15}$/.test(attendee.Phone)) {
            errors.Phone = 'Phone must be 10-15 digits';
        }
        if (attendee.AllowedPeople < 1) {
            errors.AllowedPeople = 'Must allow at least 1 person';
        }
        return errors;
    };

    const handleCreateAttendee = async () => {
        const errors = validateAttendee(newAttendee);
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                import.meta.env.VITE_API_BASE_URL+'/organizer/Attendees/create',
                newAttendee,
                { withCredentials: true }
            );
            showSnackbar('Attendee created successfully!', 'success');
            setModals({ ...modals, create: false });
            setNewAttendee({
                FirstName: '',
                LastName: '',
                Email: '',
                Phone: '',
                ListId: listId,
                AllowedPeople: 1,
                IsPaying: false,
            });
            setValidationErrors({});
            fetchAttendees();
        } catch (error) {
            showSnackbar(
                error.response?.data?.message || 'Failed to create attendee. Please try again.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEditAttendee = async () => {
        const errors = validateAttendee(editAttendee);
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);
        try {
            await axios.put(
                import.meta.env.VITE_API_BASE_URL+`/organizer/Attendees/updateby:${editAttendee.Id}`,
                editAttendee,
                { withCredentials: true }
            );
            showSnackbar('Attendee updated successfully!', 'success');
            setModals({ ...modals, edit: false });
            setValidationErrors({});
            fetchAttendees();
        } catch (error) {
            showSnackbar(
                error.response?.data?.message || 'Failed to update attendee. Please try again.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBulkEdit = async () => {
        if (selectedAttendees.length === 0) {
            showSnackbar('Please select at least one attendee to edit.', 'warning');
            return;
        }

        if (!bulkEditField) {
            showSnackbar('Please select a field to edit.', 'warning');
            return;
        }

        setLoading(true);
        try {
            await Promise.all(
                selectedAttendees.map(id => {
                    const attendee = attendees.find(a => a.Id === id);
                    // Convert string 'true'/'false' to boolean if needed
                    const value = bulkEditField === 'IsPaying'
                        ? bulkEditValue === true || bulkEditValue === 'true'
                        : bulkEditValue;

                    const updatedAttendee = {
                        ...attendee,
                        [bulkEditField]: value
                    };
                    return axios.put(
                        import.meta.env.VITE_API_BASE_URL+`/organizer/Attendees/updateby:${id}`,
                        updatedAttendee,
                        { withCredentials: true }
                    );
                })
            );
            showSnackbar(`${selectedAttendees.length} attendee(s) updated successfully!`, 'success');
            setModals({ ...modals, bulkEdit: false });
            setBulkEditField('');
            setBulkEditValue('');
            fetchAttendees();
        } catch (error) {
            showSnackbar('Failed to update some attendees. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAttendee = async () => {
        setLoading(true);
        try {
            await axios.delete(
                import.meta.env.VITE_API_BASE_URL+`/organizer/Attendees/deleteby:${modals.delete}`,
                { withCredentials: true }
            );
            showSnackbar('Attendee deleted successfully!', 'success');
            setModals({ ...modals, delete: false });
            fetchAttendees();
        } catch (error) {
            showSnackbar('Failed to delete attendee. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedAttendees.length === 0) {
            showSnackbar('Please select at least one attendee to delete.', 'warning');
            return;
        }

        setLoading(true);
        try {
            await Promise.all(
                selectedAttendees.map(id =>
                    axios.delete(
                        import.meta.env.VITE_API_BASE_URL+`/organizer/Attendees/deleteby:${id}`,
                        { withCredentials: true }
                    )
                )
            );
            showSnackbar(`${selectedAttendees.length} attendee(s) deleted successfully!`, 'success');
            fetchAttendees();
        } catch (error) {
            showSnackbar('Failed to delete some attendees. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedAttendees(filteredAndSortedAttendees.map(attendee => attendee.Id));
        } else {
            setSelectedAttendees([]);
        }
    };

    const handleSelectAttendee = (event, id) => {
        if (event.target.checked) {
            setSelectedAttendees([...selectedAttendees, id]);
        } else {
            setSelectedAttendees(selectedAttendees.filter(attendeeId => attendeeId !== id));
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            showSnackbar('No file selected.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                // Validate required fields
                const requiredFields = ['FirstName', 'LastName', 'Phone'];
                const missingFields = json.some(row =>
                    requiredFields.some(field => !row[field])
                );

                if (missingFields) {
                    showSnackbar('Invalid file. Ensure all rows have FirstName, LastName, and Phone.', 'error');
                    return;
                }

                // Validate emails
                const invalidEmails = json.some(row =>
                    row.Email && !/^\S+@\S+\.\S+$/.test(row.Email)
                );

                if (invalidEmails) {
                    showSnackbar('Some emails are invalid. Please correct them.', 'error');
                    return;
                }

                // Validate phones
                const invalidPhones = json.some(row =>
                    !/^[0-9]{10,15}$/.test(String(row.Phone))
                );

                if (invalidPhones) {
                    showSnackbar('Phones must be 10-15 digits. Please correct them.', 'error');
                    return;
                }

                setParsedAttendees(json);
            } catch (error) {
                showSnackbar('Error parsing file. Please check the format.', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSaveParsedAttendees = async () => {
        if (parsedAttendees.length === 0) {
            showSnackbar('No attendees to import.', 'warning');
            return;
        }

        setLoading(true);
        try {
            await Promise.all(
                parsedAttendees.map(attendee => {
                    const payload = {
                        FirstName: attendee.FirstName,
                        LastName: attendee.LastName,
                        Email: attendee.Email || null,
                        Phone: String(attendee.Phone),
                        ListId: listId,
                        AllowedPeople: attendee.AllowedPeople || 1,
                        IsPaying: attendee.IsPaying || false,
                    };
                    return axios.post(
                        import.meta.env.VITE_API_BASE_URL+'/organizer/Attendees/create',
                        payload,
                        { withCredentials: true }
                    );
                })
            );
            showSnackbar('All attendees imported successfully!', 'success');
            setModals({ ...modals, import: false });
            setParsedAttendees([]);
            fetchAttendees();
        } catch (error) {
            showSnackbar('Failed to import some attendees. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExportAttendees = () => {
        const dataToExport = selectedAttendees.length > 0
            ? attendees.filter(attendee => selectedAttendees.includes(attendee.Id))
                .map(attendee => ({
                    FirstName: attendee.FirstName,
                    LastName: attendee.LastName,
                    Email: attendee.Email || '',
                    Phone: attendee.Phone,
                    AllowedPeople: attendee.AllowedPeople,
                    PaymentStatus: attendee.IsPaying ? 'Paying' : 'Non-paying'
                }))
            : attendees.map(attendee => ({
                FirstName: attendee.FirstName,
                LastName: attendee.LastName,
                Email: attendee.Email || '',
                Phone: attendee.Phone,
                AllowedPeople: attendee.AllowedPeople,
                PaymentStatus: attendee.IsPaying ? 'Paying' : 'Non-paying'
            }));

        if (dataToExport.length === 0) {
            showSnackbar('No attendees to export.', 'warning');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');
        XLSX.writeFile(workbook, `attendees_${listDetails.name || 'list'}_${new Date().toISOString().split('T')[0]}.xlsx`);
        showSnackbar('Export completed successfully!', 'success');
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                FirstName: 'John',
                LastName: 'Doe',
                Email: 'john.doe@example.com',
                Phone: '1234567890',
                AllowedPeople: 1,
                IsPaying: true
            },
            {
                FirstName: 'Jane',
                LastName: 'Smith',
                Email: 'jane.smith@example.com',
                Phone: '0987654321',
                AllowedPeople: 2,
                IsPaying: false
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'attendees_template.xlsx');
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const openBulkMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeBulkMenu = () => {
        setAnchorEl(null);
    };

    const openFilterMenu = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const closeFilterMenu = () => {
        setFilterAnchorEl(null);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        
        // Set filter based on tab
        if (newValue === 0) {
            setFilterPaymentStatus('all');
        } else if (newValue === 1) {
            setFilterPaymentStatus('paying');
        } else if (newValue === 2) {
            setFilterPaymentStatus('non-paying');
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Backdrop 
                open={loading} 
                sx={{ 
                    color: '#fff', 
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backdropFilter: 'blur(2px)'
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress color="primary" size={60} />
                    <Typography variant="body1" color="white">
                        Loading...
                    </Typography>
                </Box>
            </Backdrop>

            <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Button
                            startIcon={<FiChevronLeft />}
                            onClick={() => navigate('/guestlists')}
                            variant="outlined"
                            sx={{ textTransform: 'none' }}
                        >
                            Back to Lists
                        </Button>

                        <Badge badgeContent={attendees.length} color="primary" showZero>
                            <Chip
                                icon={<FiUsers size={16} />}
                                label="Attendees"
                                color="primary"
                                variant="outlined"
                            />
                        </Badge>
                    </Box>

                    <StyledPaper elevation={3} sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                            <Box>
                                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                    {listDetails.name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                    {listDetails.description || 'No description provided'}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Chip 
                                        icon={<FiUsers size={14} />} 
                                        label={`${stats.total} Attendees`} 
                                        color="primary" 
                                    />
                                    <Chip 
                                        icon={<FiDollarSign size={14} />} 
                                        label={`${stats.paying} Paying`} 
                                        color="secondary" 
                                    />
                                    <Chip 
                                        icon={<FiUser size={14} />} 
                                        label={`${stats.totalAllowed} Total Allowed`} 
                                        color="default" 
                                    />
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mt: { xs: 2, md: 0 } }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<FiDownload />}
                                    onClick={handleExportAttendees}
                                >
                                    Export
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<FiUpload />}
                                    onClick={() => setModals({ ...modals, import: true })}
                                >
                                    Import
                                </Button>
                            </Box>
                        </Box>
                    </StyledPaper>

                    {/* Search and Filter Bar */}
                    <StyledPaper elevation={3} sx={{ p: 3, mb: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Search attendees by name, email or phone..."
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FiSearch />
                                        </InputAdornment>
                                    ),
                                }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ maxWidth: { xs: '100%', md: 400 } }}
                            />
                            <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 } }}>
                                {selectedAttendees.length > 0 && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<FiCheck />}
                                        onClick={openBulkMenu}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {selectedAttendees.length} Selected
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<FiPlus />}
                                    onClick={() => setModals({ ...modals, create: true })}
                                >
                                    Add Attendee
                                </Button>
                                <IconButton
                                    color="primary"
                                    onClick={openFilterMenu}
                                    sx={{ display: { xs: 'flex', md: 'none' } }}
                                >
                                    <Badge
                                        color="secondary"
                                        variant="dot"
                                        invisible={filterPaymentStatus === 'all'}
                                    >
                                        <FiFilter />
                                    </Badge>
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Tabs for filtering - visible on larger screens */}
                        <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 2 }}>
                            <Tabs 
                                value={tabValue} 
                                onChange={handleTabChange}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="fullWidth"
                            >
                                <Tab 
                                    label={`All Attendees (${stats.total})`} 
                                    icon={<FiUsers size={16} />} 
                                    iconPosition="start"
                                />
                                <Tab 
                                    label={`Paying (${stats.paying})`} 
                                    icon={<FiDollarSign size={16} />} 
                                    iconPosition="start"
                                />
                                <Tab 
                                    label={`Non-Paying (${stats.nonPaying})`} 
                                    icon={<FiUser size={16} />} 
                                    iconPosition="start"
                                />
                            </Tabs>
                        </Box>
                    </StyledPaper>

                    {/* Attendees Table */}
                    <StyledPaper elevation={3}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
                                    <TableRow>
                                        <TableCell padding="checkbox" sx={{ color: 'common.white' }}>
                                            <Checkbox
                                                indeterminate={
                                                    selectedAttendees.length > 0 &&
                                                    selectedAttendees.length < filteredAndSortedAttendees.length
                                                }
                                                checked={
                                                    filteredAndSortedAttendees.length > 0 &&
                                                    selectedAttendees.length === filteredAndSortedAttendees.length
                                                }
                                                onChange={handleSelectAll}
                                                sx={{ 
                                                    color: 'common.white', 
                                                    '&.Mui-checked': { color: 'common.white' },
                                                    '&.MuiCheckbox-indeterminate': { color: 'common.white' }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell
                                            sx={{ 
                                                color: 'common.white', 
                                                fontWeight: 'bold', 
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => requestSort('FirstName')}
                                        >
                                            Name {getSortIndicator('FirstName')}
                                        </TableCell>
                                        {!isMobile && (
                                            <TableCell
                                                sx={{ 
                                                    color: 'common.white', 
                                                    fontWeight: 'bold', 
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => requestSort('Email')}
                                            >
                                                Contact {getSortIndicator('Email')}
                                            </TableCell>
                                        )}
                                        <TableCell
                                            sx={{ 
                                                color: 'common.white', 
                                                fontWeight: 'bold', 
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => requestSort('AllowedPeople')}
                                        >
                                            Status {getSortIndicator('AllowedPeople')}
                                        </TableCell>
                                        <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredAndSortedAttendees.length > 0 ? (
                                        filteredAndSortedAttendees.map((attendee) => (
                                            <StyledTableRow key={attendee.Id} hover>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedAttendees.includes(attendee.Id)}
                                                        onChange={(event) => handleSelectAttendee(event, attendee.Id)}
                                                    />
                                                </TableCell>
                                                <TableCell 
                                                    sx={{ minWidth: 200 }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: theme.palette.primary.main }}>
                                                            {getInitials(attendee.FirstName, attendee.LastName)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                                                {attendee.FirstName} {attendee.LastName}
                                                            </Typography>
                                                            {isMobile && attendee.Phone && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <FiPhone size={12} /> {attendee.Phone}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                {!isMobile && (
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            {attendee.Email && (
                                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <FiMail size={14} />
                                                                    {attendee.Email}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <FiPhone size={14} />
                                                                {attendee.Phone}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        <Chip
                                                            size="small"
                                                            icon={<FiUsers size={12} />}
                                                            label={`${attendee.AllowedPeople} ${attendee.AllowedPeople > 1 ? 'people' : 'person'}`}
                                                            color="primary"
                                                        />
                                                        <Chip
                                                            size="small"
                                                            icon={attendee.IsPaying ? <FiDollarSign size={12} /> : <FiInfo size={12} />}
                                                            label={attendee.IsPaying ? "Paying" : "Non-paying"}
                                                            color={attendee.IsPaying ? "secondary" : "error"}
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                color="primary"
                                                                onClick={() => {
                                                                    setEditAttendee({
                                                                        Id: attendee.Id,
                                                                        FirstName: attendee.FirstName,
                                                                        LastName: attendee.LastName,
                                                                        Email: attendee.Email,
                                                                        Phone: attendee.Phone,
                                                                        ListId: listId,
                                                                        AllowedPeople: attendee.AllowedPeople,
                                                                        IsPaying: attendee.IsPaying,
                                                                    });
                                                                    setModals({ ...modals, edit: true });
                                                                }}
                                                                size="small"
                                                            >
                                                                <FiEdit size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                color="error"
                                                                onClick={() => setModals({ ...modals, delete: attendee.Id })}
                                                                size="small"
                                                            >
                                                                <FiTrash size={18} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </StyledTableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={isMobile ? 4 : 5}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, textAlign: 'center' }}>
                                                    <FiUsers size={48} color={theme.palette.text.secondary} />
                                                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                                                        {searchTerm ? 'No matching attendees found' : 'No attendees available'}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                                                        {searchTerm 
                                                            ? 'Try adjusting your search or filters' 
                                                            : 'Add your first attendee to get started'}
                                                    </Typography>
                                                    {!searchTerm && (
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={<FiPlus />}
                                                            onClick={() => setModals({ ...modals, create: true })}
                                                        >
                                                            Add Attendee
                                                        </Button>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </StyledPaper>
                </Box>
            </Box>

            {/* Create Attendee Modal */}
            <Dialog
                open={modals.create}
                onClose={() => {
                    setModals({ ...modals, create: false });
                    setValidationErrors({});
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    bgcolor: theme.palette.primary.main, 
                    color: 'common.white'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiUser /> Create New Attendee
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setModals({ ...modals, create: false });
                                setValidationErrors({});
                            }}
                            sx={{ color: 'common.white' }}
                            size="small"
                        >
                            <FiX />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label="First Name"
                            value={newAttendee.FirstName}
                            onChange={(e) => setNewAttendee({ ...newAttendee, FirstName: e.target.value })}
                            margin="normal"
                            variant="outlined"
                            error={!!validationErrors.FirstName}
                            helperText={validationErrors.FirstName}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FiUser size={18} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Last Name"
                            value={newAttendee.LastName}
                            onChange={(e) => setNewAttendee({ ...newAttendee, LastName: e.target.value })}
                            margin="normal"
                            variant="outlined"
                            error={!!validationErrors.LastName}
                            helperText={validationErrors.LastName}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FiUser size={18} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <TextField
                        fullWidth
                        label="Email"
                        value={newAttendee.Email}
                        onChange={(e) => setNewAttendee({ ...newAttendee, Email: e.target.value })}
                        margin="normal"
                        variant="outlined"
                        error={!!validationErrors.Email}
                        helperText={validationErrors.Email || "Optional"}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FiMail size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Phone"
                        value={newAttendee.Phone}
                        onChange={(e) => setNewAttendee({ ...newAttendee, Phone: e.target.value })}
                        margin="normal"
                        variant="outlined"
                        error={!!validationErrors.Phone}
                        helperText={validationErrors.Phone}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FiPhone size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Allowed People"
                        type="number"
                        value={newAttendee.AllowedPeople}
                        onChange={(e) => setNewAttendee({
                            ...newAttendee,
                            AllowedPeople: Math.max(1, parseInt(e.target.value) || 1)
                        })}
                        margin="normal"
                        variant="outlined"
                        error={!!validationErrors.AllowedPeople}
                        helperText={validationErrors.AllowedPeople}
                        inputProps={{ min: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FiUsers size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={newAttendee.IsPaying || false}
                                onChange={(e) => setNewAttendee({
                                    ...newAttendee,
                                    IsPaying: e.target.checked,
                                })}
                                color="secondary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiDollarSign size={18} />
                                <Typography variant="body1">Paying Attendee</Typography>
                            </Box>
                        }
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => {
                            setModals({ ...modals, create: false });
                            setValidationErrors({});
                        }}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateAttendee}
                        startIcon={<FiPlus />}
                    >
                        Create Attendee
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Attendee Modal */}
            <Dialog
                open={modals.edit}
                onClose={() => {
                    setModals({ ...modals, edit: false });
                    setValidationErrors({});
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    bgcolor: theme.palette.primary.main, 
                    color: 'common.white'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiEdit /> Edit Attendee
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setModals({ ...modals, edit: false });
                                setValidationErrors({});
                            }}
                            sx={{ color: 'common.white' }}
                            size="small"
                        >
                            <FiX />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label="First Name"
                            value={editAttendee.FirstName}
                            onChange={(e) => setEditAttendee({ ...editAttendee, FirstName: e.target.value })}
                            margin="normal"
                            variant="outlined"
                            error={!!validationErrors.FirstName}
                            helperText={validationErrors.FirstName}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FiUser size={18} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Last Name"
                            value={editAttendee.LastName}
                            onChange={(e) => setEditAttendee({ ...editAttendee, LastName: e.target.value })}
                            margin="normal"
                            variant="outlined"
                            error={!!validationErrors.LastName}
                            helperText={validationErrors.LastName}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FiUser size={18} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <TextField
                        fullWidth
                        label="Email"
                        value={editAttendee.Email}
                        onChange={(e) => setEditAttendee({ ...editAttendee, Email: e.target.value })}
                        margin="normal"
                        variant="outlined"
                        error={!!validationErrors.Email}
                        helperText={validationErrors.Email || "Optional"}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FiMail size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Phone"
                        value={editAttendee.Phone}
                        onChange={(e) => setEditAttendee({ ...editAttendee, Phone: e.target.value })}
                        margin="normal"
                        variant="outlined"
                        error={!!validationErrors.Phone}
                        helperText={validationErrors.Phone}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FiPhone size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Allowed People"
                        type="number"
                        value={editAttendee.AllowedPeople}
                        onChange={(e) => setEditAttendee({
                            ...editAttendee,
                            AllowedPeople: Math.max(1, parseInt(e.target.value) || 1)
                        })}
                        margin="normal"
                        variant="outlined"
                        error={!!validationErrors.AllowedPeople}
                        helperText={validationErrors.AllowedPeople}
                        inputProps={{ min: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FiUsers size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={editAttendee.IsPaying || false}
                                onChange={(e) => setEditAttendee({
                                    ...editAttendee,
                                    IsPaying: e.target.checked,
                                })}
                                color="secondary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiDollarSign size={18} />
                                <Typography variant="body1">Paying Attendee</Typography>
                            </Box>
                        }
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => {
                            setModals({ ...modals, edit: false });
                            setValidationErrors({});
                        }}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleEditAttendee}
                        startIcon={<FiCheck />}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Edit Modal */}
            <Dialog
                open={modals.bulkEdit}
                onClose={() => {
                    setModals({ ...modals, bulkEdit: false });
                    setBulkEditField('');
                    setBulkEditValue('');
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    bgcolor: theme.palette.primary.main, 
                    color: 'common.white'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiEdit /> Bulk Edit {selectedAttendees.length} Attendees
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setModals({ ...modals, bulkEdit: false });
                                setBulkEditField('');
                                setBulkEditValue('');
                            }}
                            sx={{ color: 'common.white' }}
                            size="small"
                        >
                            <FiX />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <TextField
                        select
                        fullWidth
                        label="Field to Edit"
                        value={bulkEditField}
                        onChange={(e) => {
                            setBulkEditField(e.target.value);
                            // Initialize to false when selecting IsPaying
                            if (e.target.value === 'IsPaying') {
                                setBulkEditValue(false);
                            } else {
                                setBulkEditValue('');
                            }
                        }}
                        margin="normal"
                        variant="outlined"
                        SelectProps={{
                            native: true,
                        }}
                        sx={{ mb: 3 }}
                    >
                        <option value="">Select a field</option>
                        <option value="FirstName">First Name</option>
                        <option value="LastName">Last Name</option>
                        <option value="Email">Email</option>
                        <option value="Phone">Phone</option>
                        <option value="AllowedPeople">Allowed People</option>
                        <option value="IsPaying">Payment Status</option>
                    </TextField>

                    {bulkEditField && bulkEditField !== 'IsPaying' && (
                        <TextField
                            fullWidth
                            label={`New ${bulkEditField} value`}
                            value={bulkEditValue}
                            onChange={(e) => setBulkEditValue(e.target.value)}
                            margin="normal"
                            variant="outlined"
                            type={bulkEditField === 'AllowedPeople' ? 'number' : 'text'}
                            inputProps={bulkEditField === 'AllowedPeople' ? { min: 1 } : {}}
                            InputProps={{
                                startAdornment: bulkEditField === 'Email' ? (
                                    <InputAdornment position="start">
                                        <FiMail size={18} />
                                    </InputAdornment>
                                ) : bulkEditField === 'Phone' ? (
                                    <InputAdornment position="start">
                                        <FiPhone size={18} />
                                    </InputAdornment>
                                ) : bulkEditField === 'AllowedPeople' ? (
                                    <InputAdornment position="start">
                                        <FiUsers size={18} />
                                    </InputAdornment>
                                ) : (
                                    <InputAdornment position="start">
                                        <FiUser size={18} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                    {bulkEditField === 'IsPaying' && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={bulkEditValue === true}
                                    onChange={(e) => setBulkEditValue(e.target.checked)}
                                    color="secondary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FiDollarSign size={18} />
                                    <Typography variant="body1">Mark as paying</Typography>
                                </Box>
                            }
                            sx={{ mt: 1 }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => {
                            setModals({ ...modals, bulkEdit: false });
                            setBulkEditField('');
                            setBulkEditValue('');
                        }}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleBulkEdit}
                        disabled={
                            !bulkEditField ||
                            (bulkEditField !== 'IsPaying' && !bulkEditValue) ||
                            (bulkEditField === 'IsPaying' && bulkEditValue === undefined)
                        }
                        startIcon={<FiCheck />}
                    >
                        Apply Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!modals.delete}
                onClose={() => setModals({ ...modals, delete: false })}
            >
                <DialogTitle sx={{ 
                    color: theme.palette.error.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <FiTrash /> Confirm Delete
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <DialogContentText>
                        Are you sure you want to delete this attendee? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => setModals({ ...modals, delete: false })}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteAttendee}
                        startIcon={<FiTrash />}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import Attendees Modal */}
            <Dialog
                open={modals.import}
                onClose={() => setModals({ ...modals, import: false })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ 
                    bgcolor: theme.palette.primary.main, 
                    color: 'common.white'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiUpload /> Import Attendees
                        </Typography>
                        <IconButton
                            onClick={() => setModals({ ...modals, import: false })}
                            sx={{ color: 'common.white' }}
                            size="small"
                        >
                            <FiX />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Upload Excel File
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Upload an Excel file to import attendees. The file should include these columns:
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                            gap: 2, 
                            mt: 2, 
                            mb: 3,
                            p: 2,
                            bgcolor: 'rgba(0, 0, 0, 0.02)',
                            borderRadius: 2
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiUser size={16} color={theme.palette.primary.main} />
                                <Typography variant="body2"><strong>FirstName</strong> (required)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiUser size={16} color={theme.palette.primary.main} />
                                <Typography variant="body2"><strong>LastName</strong> (required)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiPhone size={16} color={theme.palette.primary.main} />
                                <Typography variant="body2"><strong>Phone</strong> (required, 10-15 digits)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiMail size={16} color={theme.palette.primary.main} />
                                <Typography variant="body2"><strong>Email</strong> (optional)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiUsers size={16} color={theme.palette.primary.main} />
                                <Typography variant="body2"><strong>AllowedPeople</strong> (optional, defaults to 1)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiDollarSign size={16} color={theme.palette.primary.main} />
                                <Typography variant="body2"><strong>IsPaying</strong> (optional, TRUE/FALSE)</Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<FiDownload />}
                            onClick={handleDownloadTemplate}
                            sx={{ mb: 3 }}
                        >
                            Download Template
                        </Button>
                    </Box>

                    <Box sx={{ 
                        border: `2px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        mb: 3
                    }}>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            id="file-upload"
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="file-upload">
                            <Button
                                variant="contained"
                                color="primary"
                                component="span"
                                startIcon={<FiUpload />}
                                sx={{ mb: 2 }}
                            >
                                Select Excel File
                            </Button>
                        </label>
                        <Typography variant="body2" color="text.secondary">
                            Drag and drop your Excel file here, or click to select
                        </Typography>
                    </Box>

                    {parsedAttendees.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiCheck /> Preview ({parsedAttendees.length} attendees)
                            </Typography>
                            <StyledPaper elevation={2} sx={{ maxHeight: 400, overflow: 'auto', mt: 2 }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                                        <TableRow>
                                            <TableCell>First Name</TableCell>
                                            <TableCell>Last Name</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Phone</TableCell>
                                            <TableCell>Allowed</TableCell>
                                            <TableCell>Paying</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {parsedAttendees.map((attendee, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{attendee.FirstName}</TableCell>
                                                <TableCell>{attendee.LastName}</TableCell>
                                                <TableCell>{attendee.Email || '-'}</TableCell>
                                                <TableCell>{attendee.Phone}</TableCell>
                                                <TableCell>{attendee.AllowedPeople || 1}</TableCell>
                                                <TableCell>
                                                    {attendee.IsPaying ? (
                                                        <Chip size="small" label="Yes" color="secondary" />
                                                    ) : (
                                                        <Chip size="small" label="No" color="error" />
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            const updated = [...parsedAttendees];
                                                            updated.splice(index, 1);
                                                            setParsedAttendees(updated);
                                                        }}
                                                    >
                                                        <FiTrash size={16} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </StyledPaper>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => setModals({ ...modals, import: false })}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveParsedAttendees}
                        disabled={parsedAttendees.length === 0}
                        startIcon={<FiUpload />}
                    >
                        Import {parsedAttendees.length} Attendees
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeBulkMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        borderRadius: 2,
                        minWidth: 180,
                    }
                }}
            >
                <MenuItem
                    onClick={() => {
                        setModals({ ...modals, bulkEdit: true });
                        closeBulkMenu();
                    }}
                    sx={{ borderRadius: 1, mx: 0.5, my: 0.5 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FiEdit size={18} color={theme.palette.primary.main} />
                        <Typography variant="body2">Bulk Edit</Typography>
                    </Box>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleExportAttendees();
                        closeBulkMenu();
                    }}
                    sx={{ borderRadius: 1, mx: 0.5, my: 0.5 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FiDownload size={18} color={theme.palette.primary.main} />
                        <Typography variant="body2">Export Selected</Typography>
                    </Box>
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem
                    onClick={() => {
                        handleBulkDelete();
                        closeBulkMenu();
                    }}
                    sx={{ borderRadius: 1, mx: 0.5, my: 0.5, color: theme.palette.error.main }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FiTrash size={18} />
                        <Typography variant="body2">Bulk Delete</Typography>
                    </Box>
                </MenuItem>
            </Menu>

            {/* Filter Menu (for mobile) */}
            <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={closeFilterMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        borderRadius: 2,
                        minWidth: 180,
                    }
                }}
            >
                <MenuItem
                    onClick={() => {
                        setFilterPaymentStatus('all');
                        setTabValue(0);
                        closeFilterMenu();
                    }}
                    selected={filterPaymentStatus === 'all'}
                    sx={{ borderRadius: 1, mx: 0.5, my: 0.5 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FiUsers size={18} color={theme.palette.primary.main} />
                        <Typography variant="body2">All Attendees</Typography>
                    </Box>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setFilterPaymentStatus('paying');
                        setTabValue(1);
                        closeFilterMenu();
                    }}
                    selected={filterPaymentStatus === 'paying'}
                    sx={{ borderRadius: 1, mx: 0.5, my: 0.5 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FiDollarSign size={18} color={theme.palette.secondary.main} />
                        <Typography variant="body2">Paying Only</Typography>
                    </Box>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setFilterPaymentStatus('non-paying');
                        setTabValue(2);
                        closeFilterMenu();
                    }}
                    selected={filterPaymentStatus === 'non-paying'}
                    sx={{ borderRadius: 1, mx: 0.5, my: 0.5 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FiUser size={18} color={theme.palette.error.main} />
                        <Typography variant="body2">Non-Paying Only</Typography>
                    </Box>
                </MenuItem>
            </Menu>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ 
                    '& .MuiAlert-root': {
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    }
                }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                    icon={snackbar.severity === 'success' ? <FiCheck /> : <FiInfo />}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default AttendeesPage;