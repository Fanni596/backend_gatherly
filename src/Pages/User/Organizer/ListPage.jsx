import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import {
  FiEdit, FiTrash, FiUsers, FiPlus, FiX, FiSearch, FiCheck,
  FiDownload, FiUpload, FiFilter, FiGrid, FiList, FiInfo, FiShare2,
  FiChevronDown, FiTag, FiCalendar, FiClock, FiRefreshCw, FiAlertTriangle,
  FiCopy, FiArchive, FiLock, FiEye, FiEyeOff, FiStar, FiMoreVertical,
  FiArrowUp, FiArrowDown, FiSettings, FiSliders, FiFileText, FiMail
} from 'react-icons/fi';
import {
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
  TextField,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Tabs,
  Tab,
  Typography,
  Switch,
  FormControlLabel,
  Badge,
  Autocomplete,
  Skeleton,
  Drawer,
  Box,
  Collapse,
  Avatar,
  Zoom,
  Fade,
  Grid,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  ButtonGroup,
  LinearProgress,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link,
  Stack
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { format, formatDistance } from 'date-fns';
import { CSVLink } from 'react-csv';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Styled components with enhanced aesthetics
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.action.hover, 0.3),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.action.selected, 0.2),
    transition: 'background-color 0.3s ease',
  },
  transition: 'all 0.2s ease',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  borderRadius: 16,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'visible',
  position: 'relative',
}));

const CardActions = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2, 2),
  marginTop: 'auto',
}));

const SearchBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  borderRadius: 16,
  boxShadow: theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
  transition: 'box-shadow 0.3s ease',
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -5,
    top: -5,
    padding: '0 4px',
  },
}));

const EmptyState = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(8),
  textAlign: 'center',
}));

const FiltersContainer = styled(motion.div)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: 16,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(20px)',
  boxShadow: theme.shadows[2],
}));

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));

const ActionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    marginTop: 0,
  },
}));

const CardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
}));

const CardBadge = styled(Box)(({ theme, color = 'primary.main' }) => ({
  position: 'absolute',
  top: -10,
  right: 16,
  backgroundColor: theme.palette[color.split('.')[0]][color.split('.')[1] || 'main'],
  color: '#fff',
  borderRadius: 12,
  padding: theme.spacing(0.5, 1.5),
  fontSize: '0.75rem',
  fontWeight: 'bold',
  boxShadow: theme.shadows[2],
  zIndex: 1,
}));

const ListItemCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 12,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const ListsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // State management
  const [lists, setLists] = useState([]);
  const [filteredLists, setFilteredLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('name_asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const csvLinkRef = useRef();
  const [newList, setNewList] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [modal, setModal] = useState({
    create: false,
    edit: false,
    delete: false,
    bulkDelete: false,
    clone: false,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: [],
    isPrivate: true
  });

  const [editData, setEditData] = useState({
    id: null,
    name: '',
    description: '',
    category: '',
    tags: [],
    isPrivate: false
  });

  const [listToDelete, setListToDelete] = useState(null);
  const [selectedLists, setSelectedLists] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tagOptions, setTagOptions] = useState(['VIP', 'Sponsor', 'Staff', 'Media', 'Speaker']);
  const [categories] = useState(['Event', 'Workshop', 'Conference', 'Webinar', 'Other']);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null);
  const [activeListId, setActiveListId] = useState(null);

  const navigate = useNavigate();

  // Fetch initial data
  useEffect(() => {
    fetchLists();
  }, []);

  // Filter and sort lists
  useEffect(() => {
    // First, filter out any null/undefined lists
    let filtered = [...lists].filter(list => list != null);

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(list =>
        list.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.Tags?.some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(list => {
        if (filterStatus === 'active') return !list.IsArchived;
        if (filterStatus === 'archived') return list.IsArchived;
        return true;
      });
    }

    // Apply tab filter
    if (selectedTab === 1) { // Archived Lists
      filtered = filtered.filter(list => list.IsArchived);
    } else if (selectedTab === 2) { // Active Lists
      filtered = filtered.filter(list => !list.IsArchived);
    }

    // Sort lists with null checks
    filtered.sort((a, b) => {
      // Handle cases where either item is null/undefined
      if (!a && !b) return 0;
      if (!a) return 1;  // nulls last
      if (!b) return -1; // nulls last

      switch (sortOrder) {
        case 'name_asc':
          return (a.Name || '').localeCompare(b.Name || '');
        case 'name_desc':
          return (b.Name || '').localeCompare(a.Name || '');
        case 'created_desc':
          return (new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0));
        case 'created_asc':
          return (new Date(a.CreatedDate || 0) - new Date(b.CreatedDate || 0));
        case 'modified_desc':
          return (new Date(b.LastModifiedDate || b.CreatedDate || 0) - 
                new Date(a.LastModifiedDate || a.CreatedDate || 0));
        case 'modified_asc':
          return (new Date(a.LastModifiedDate || a.CreatedDate || 0) - 
                new Date(b.LastModifiedDate || b.CreatedDate || 0));
        case 'attendees_desc':
          return (b.AttendeeCount || 0) - (a.AttendeeCount || 0);
        case 'attendees_asc':
          return (a.AttendeeCount || 0) - (b.AttendeeCount || 0);
        default:
          return 0;
      }
    });

    setFilteredLists(filtered);
  }, [searchTerm, lists, sortOrder, selectedTab, filterStatus, showArchived]);

  // Pagination logic
  const paginatedLists = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLists.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLists, currentPage, itemsPerPage]);

  const pageCount = useMemo(() =>
    Math.ceil(filteredLists.length / itemsPerPage),
    [filteredLists, itemsPerPage]
  );

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // API functions
  const fetchLists = async () => {
    setInitialLoading(true);
    try {
      const response = await axios.get(import.meta.env.VITE_API_BASE_URL+'/organizer/AttendeeLists/getall', { 
        withCredentials: true 
      });
  
      const enhancedData = Array.isArray(response.data) ? await Promise.all(response.data.map(async list => {
        // Fetch additional attendee stats for each list
        const attendeeStats = await axios.get(
          import.meta.env.VITE_API_BASE_URL+`/organizer/Attendees/stats?listId=${list.Id}`,
          { withCredentials: true }
        ).catch(() => null);
  
        return {
          ...list,
          Tags: Array.isArray(list.Tags) ? list.Tags : 
               typeof list.Tags === 'string' ? JSON.parse(list.Tags || '[]') : [],
          AttendeeCount: list.AttendeeCount || 0,
          AllowedPeopleTotal: attendeeStats?.data?.totalAllowedPeople || 0,
          IsOwner: list.IsOwner !== undefined ? list.IsOwner : true,
          IsArchived: list.IsArchived || false,
          IsPrivate: list.IsPrivate || false,
          Category: list.Category || categories[Math.floor(Math.random() * categories.length)]
        };
      })) : [];
  
      setLists(enhancedData);
      setSelectedLists([]);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
      showSnackbar('Failed to fetch lists. Please try again.', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  const refreshLists = async () => {
    setRefreshing(true);
    try {
      await fetchLists();
      showSnackbar('Lists refreshed successfully', 'success');
    } catch (error) {
      console.error('Failed to refresh lists:', error);
      showSnackbar('Failed to refresh lists', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateList = async () => {
    if (!formData.name) {
      showSnackbar('List name is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(import.meta.env.VITE_API_BASE_URL+'/organizer/AttendeeLists/create', {
        Name: formData.name,
        Description: formData.description,
        Category: formData.category,
        Tags: formData.tags,
        IsPrivate: formData.isPrivate
      }, { withCredentials: true });

      setLists(prevLists => [newList, ...prevLists]);
      showSnackbar('List created successfully!', 'success');
      setModal({ ...modal, create: false });
      setFormData({ name: '', description: '', category: '', tags: [], isPrivate: false });
    } catch (error) {
      console.error('Failed to create list:', error);
      showSnackbar('Failed to create list. Please try again.', 'error');
    } finally {
      setLoading(false);
      fetchLists(); // Refresh the list after creation
    }
  };

  const handleEditList = async () => {
    if (!editData.name) {
      showSnackbar('List name is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.put(import.meta.env.VITE_API_BASE_URL+`/organizer/AttendeeLists/updateby:${editData.id}`, {
        Name: editData.name,
        Description: editData.description,
        Category: editData.category,
        Tags: editData.tags,
        IsPrivate: editData.isPrivate
      }, { withCredentials: true });

      // For demo purposes, update the list in state directly
      setLists(prevLists => prevLists.map(list =>
        list.Id === editData.id
          ? {
            ...list,
            Name: editData.name,
            Description: editData.description,
            LastModifiedDate: new Date().toISOString(),
            Tags: editData.tags,
            Category: editData.category,
            IsPrivate: editData.isPrivate
          }
          : list
      ));

      showSnackbar('List updated successfully!', 'success');
      setModal({ ...modal, edit: false });
    } catch (error) {
      console.error('Failed to update list:', error);
      showSnackbar('Failed to update list. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async () => {
    setLoading(true);
    try {
      await axios.delete(import.meta.env.VITE_API_BASE_URL+`/organizer/AttendeeLists/deleteby:${listToDelete}`, { withCredentials: true });
      setLists(prevLists => prevLists.filter(list => list.Id !== listToDelete));
      showSnackbar('List deleted successfully!', 'success');
      setModal({ ...modal, delete: false });
    } catch (error) {
      console.error('Failed to delete list:', error.response?.data.message || error);
      showSnackbar('Failed to delete some lists.'+ error.response?.data.message || error +' Please try again.', 'error');

    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLists.length === 0) {
      showSnackbar('Please select at least one list to delete.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedLists.map(id =>
          axios.delete(import.meta.env.VITE_API_BASE_URL+`/organizer/AttendeeLists/deleteby:${id}`, { withCredentials: true })
        )
      );
      setLists(prevLists => prevLists.filter(list => !selectedLists.includes(list.Id)));
      showSnackbar(`${selectedLists.length} list(s) deleted successfully!`, 'success');
      setModal({ ...modal, bulkDelete: false });
      setSelectedLists([]);
    } catch (error) {
      console.error('Failed to delete lists:', error);
      showSnackbar('Failed to delete some lists.'+ error.response?.data.message || error +' Please try again.', 'error');
    } finally {
      setLoading(false);
      fetchLists(); // Refresh the list after deletion
    }
  };

  const handleArchiveList = async (id, archive) => {
    setLoading(true);
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL+`/organizer/AttendeeLists/archive/${id}`,
        archive, // Send the boolean value directly
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json' // Ensure proper content type
          }
        }
      );
      // Update in state
      setLists(prevLists => prevLists.map(list =>
        list.Id === id
        ? { ...list, IsArchived: archive, LastModifiedDate: new Date().toISOString() }
        : list
      ));
      
      showSnackbar(`List ${archive ? 'archived' : 'unarchived'} successfully!`, 'success');
    } catch (error) {
      console.error(`Failed to ${archive ? 'archive' : 'unarchive'} list:`, error.response?.data.message || error);
      showSnackbar(`Failed to ${archive ? 'archive' : 'unarchive'} list.` + error.response?.data.message || ` Please try again.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneList = async (id) => {
    setLoading(true);
    try {
      // Call the clone endpoint with the list ID
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL+`/organizer/AttendeeLists/clone/${id}`,
        {}, // Empty body since all data comes from the original list
        { withCredentials: true }
      );

      // Fetch the updated list of lists after cloning
      await fetchLists();

      showSnackbar('List cloned successfully!', 'success');
    } catch (error) {
      console.error('Failed to clone list:', error);
      showSnackbar('Failed to clone list. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const openEditModal = (list) => {
    setEditData({
      id: list.Id,
      name: list.Name,
      description: list.Description || '',
      category: list.Category || '',
      tags: list.Tags || [],
      isPrivate: list.IsPrivate || false
    });
    setModal({ ...modal, edit: true });
  };

  const openDeleteDialog = (id) => {
    setListToDelete(id);
    setModal({ ...modal, delete: true });
  };

  const openBulkMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeBulkMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedLists(filteredLists.map(list => list.Id));
    } else {
      setSelectedLists([]);
    }
  };

  const handleSelectList = (event, id) => {
    if (event.target.checked) {
      setSelectedLists([...selectedLists, id]);
    } else {
      setSelectedLists(selectedLists.filter(listId => listId !== id));
    }
  };

  const handleViewListDetails = (list) => {
    setSelectedList(list);
    setDrawerOpen(true);
  };

  const getFormattedDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  const handleMoreMenuOpen = (event, listId) => {
    setActiveListId(listId);
    setMoreMenuAnchorEl(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchorEl(null);
  };

  // CSV export data preparation
  const csvData = selectedLists.length > 0
    ? lists
      .filter(list => selectedLists.includes(list.Id))
      .map(list => ({
        Name: list.Name,
        Description: list.Description || '',
        Category: list.Category || '',
        Tags: (list.Tags || []).join(', '),
        'Attendee Count': list.AttendeeCount || 0,
        'Created Date': getFormattedDate(list.CreatedDate),
        'Last Modified': getFormattedDate(list.LastModifiedDate),
        'Is Archived': list.IsArchived ? 'Yes' : 'No'
      }))
    : [];

  // Skeleton loader for initial page load
  if (initialLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 4 } }}>
        <LinearProgress sx={{ mb: 4 }} />
        
        <Skeleton variant="rectangular" width="30%" height={40} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="20%" height={20} sx={{ mb: 4, borderRadius: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Skeleton variant="rectangular" width="60%" height={50} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width="30%" height={50} sx={{ borderRadius: 2 }} />
        </Box>

        <Skeleton variant="rectangular" height={60} sx={{ mb: 4, borderRadius: 2 }} />

        <Grid container spacing={3}>
          {Array(12).fill(0).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Render methods
  const renderGridView = () => {
    if (filteredLists.length === 0) {
      return renderEmptyState();
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          <AnimatePresence>
            {paginatedLists.map((list) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={list.Id}>
                <motion.div
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <StyledCard
                    elevation={3}
                    sx={{
                      opacity: list.IsArchived ? 0.7 : 1,
                      border: list.IsArchived ? '1px dashed grey' : 'none'
                    }}
                  >
                    {list.IsArchived && (
                      <CardBadge color="warning.main">Archived</CardBadge>
                    )}
                    
                    <CardHeader>
                      <Box>
                        {list.Category && (
                          <Chip 
                            size="small" 
                            label={list.Category} 
                            color="primary" 
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        )}
                        <Typography
                          variant="h6"
                          gutterBottom
                          className="cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleViewListDetails(list)}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            mb: 0.5
                          }}
                        >
                          {list.Name}
                          {list.IsPrivate && (
                            <Tooltip title="Private List">
                              <FiLock style={{ marginLeft: 8, verticalAlign: 'middle', fontSize: '0.8em' }} />
                            </Tooltip>
                          )}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Checkbox
                          checked={selectedLists.includes(list.Id)}
                          onChange={(event) => handleSelectList(event, list.Id)}
                          size="small"
                          sx={{
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            '&:hover': { backgroundColor: 'white' }
                          }}
                        />
                      </Box>
                    </CardHeader>

                    <CardContent sx={{ pt: 0 }}>
                      {list.Description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            height: 40,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {list.Description}
                        </Typography>
                      )}

                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        mb: 2 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiUsers size={16} style={{ marginRight: 8, color: theme.palette.primary.main }} />
                          <Typography variant="body2" fontWeight={500}>
                            {list.AttendeeCount} attendees
                          </Typography>
                        </Box>
                        <Tooltip title={getFormattedDate(list.LastModifiedDate)}>
                          <Typography variant="caption" color="text.secondary">
                            {getRelativeTime(list.LastModifiedDate)}
                          </Typography>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                        {(Array.isArray(list.Tags)
                          ? list.Tags
                          : typeof list.Tags === 'string'
                            ? JSON.parse(list.Tags || '[]')
                            : []).map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                      </Box>
                    </CardContent>

                    <CardActions>
                      <ButtonGroup size="small" variant="outlined">
                        <Tooltip title="Manage Attendees">
                          <Button
                            color="primary"
                            onClick={() => navigate(`/guestlists/manage/${list.Id}`)}
                            startIcon={<FiUsers size={16} />}
                          >
                            Manage
                          </Button>
                        </Tooltip>
                        <Tooltip title="More Options">
                          <Button
                            color="primary"
                            onClick={(e) => handleMoreMenuOpen(e, list.Id)}
                          >
                            <FiMoreVertical size={16} />
                          </Button>
                        </Tooltip>
                      </ButtonGroup>

                      <Box>
                        <Tooltip title="Edit List">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() => openEditModal(list)}
                          >
                            <FiEdit size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={list.IsArchived ? "Unarchive List" : "Archive List"}>
                          <IconButton
                            color="warning"
                            size="small"
                            onClick={() => handleArchiveList(list.Id, !list.IsArchived)}
                          >
                            <FiArchive size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </StyledCard>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </motion.div>
    );
  };

  const renderTableView = () => {
    if (filteredLists.length === 0) {
      return renderEmptyState();
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ 
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.7) 
                  : theme.palette.primary.main 
              }}>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ color: 'common.white' }}>
                    <Checkbox
                      indeterminate={
                        selectedLists.length > 0 && selectedLists.length < paginatedLists.length
                      }
                      checked={paginatedLists.length > 0 && selectedLists.length === paginatedLists.length}
                      onChange={handleSelectAll}
                      sx={{ color: 'common.white', '&.Mui-checked': { color: 'common.white' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Attendees</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Last Modified</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {paginatedLists.map((list) => (
                    <Zoom in key={list.Id} style={{ transitionDelay: '50ms' }}>
                      <StyledTableRow hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedLists.includes(list.Id)}
                            onChange={(event) => handleSelectList(event, list.Id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                bgcolor: stringToColor(list.Name),
                                width: 40,
                                height: 40,
                                mr: 2
                              }}
                            >
                              {getInitials(list.Name)}
                            </Avatar>
                            <Box>
                              <Box
                                sx={{
                                  fontWeight: 500,
                                  color: 'text.primary',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  '&:hover': { color: 'primary.main' }
                                }}
                                onClick={() => handleViewListDetails(list)}
                              >
                                {list.Name}
                                {list.IsPrivate && (
                                  <Tooltip title="Private List">
                                    <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                                      <FiLock size={14} />
                                    </Box>
                                  </Tooltip>
                                )}
                              </Box>
                              {list.Description && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    maxWidth: '300px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {list.Description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {list.Category ? (
                            <Chip
                              label={list.Category}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              None
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <StyledBadge badgeContent={list.AttendeeCount} color="primary" max={999}>
                            <FiUsers size={16} />
                          </StyledBadge>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={getFormattedDate(list.LastModifiedDate)}>
                            <Typography variant="body2">{getRelativeTime(list.LastModifiedDate)}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {list.IsArchived ? (
                            <Chip
                              label="Archived"
                              size="small"
                              color="default"
                              variant="outlined"
                              icon={<FiArchive size={12} />}
                            />
                          ) : (
                            <Chip
                              label="Active"
                              size="small"
                              color="success"
                              variant="outlined"
                              icon={<FiCheck size={12} />}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                            <Tooltip title="Manage Attendees">
                              <IconButton
                                color="primary"
                                onClick={() => navigate(`/guestlists/manage/${list.Id}`)}
                                size="small"
                              >
                                <FiUsers size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit List">
                              <IconButton
                                color="secondary"
                                onClick={() => openEditModal(list)}
                                size="small"
                              >
                                <FiEdit size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Clone List">
                              <IconButton
                                color="info"
                                onClick={() => handleCloneList(list.Id)}
                                size="small"
                              >
                                <FiCopy size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={list.IsArchived ? "Unarchive List" : "Archive List"}>
                              <IconButton
                                color="warning"
                                onClick={() => handleArchiveList(list.Id, !list.IsArchived)}
                                size="small"
                              >
                                <FiArchive size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete List">
                              <IconButton
                                color="error"
                                onClick={() => openDeleteDialog(list.Id)}
                                size="small"
                              >
                                <FiTrash size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </StyledTableRow>
                    </Zoom>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </motion.div>
    );
  };

  const renderEmptyState = () => {
    return (
      <EmptyState
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {searchTerm || filterStatus !== 'all' ? (
          <>
            <FiSearch size={60} style={{ color: theme.palette.text.disabled, marginBottom: 16 }} />
            <Typography variant="h5" gutterBottom fontWeight={600}>No matching lists found</Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Try adjusting your search or filters to find what you're looking for.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FiRefreshCw />}
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              sx={{ borderRadius: 2 }}
            >
              Clear Filters
            </Button>
          </>
        ) : (
          <>
            <FiUsers size={60} style={{ color: theme.palette.text.disabled, marginBottom: 16 }} />
            <Typography variant="h5" gutterBottom fontWeight={600}>No attendee lists yet</Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Create your first attendee list to start managing your guests.
            </Typography>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FiPlus />}
                onClick={() => setModal({ ...modal, create: true })}
                sx={{ borderRadius: 2, px: 3, py: 1 }}
              >
                Create Your First List
              </Button>
            </motion.div>
          </>
        )}
      </EmptyState>
    );
  };

  // Define missing utility functions
  const stringToColor = (string) => {
    if (!string) return '#757575';
    
    let hash = 0;
    let i;

    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }

    return color;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      p: { xs: 2, sm: 3, md: 4 }
    }}>
      <Backdrop
        open={loading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(3px)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CircularProgress color="inherit" size={60} />
        </motion.div>
      </Backdrop>

      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/dashboard" underline="hover">
              Dashboard
            </Link>
            <Typography color="text.primary">Attendee Lists</Typography>
          </Breadcrumbs>
          
          <PageHeader>
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                Attendee Lists
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Organize and manage your guests for events
              </Typography>
            </Box>

            <ActionBar>
              {selectedLists.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<FiCheck />}
                    onClick={openBulkMenu}
                    sx={{ borderRadius: 2 }}
                  >
                    {selectedLists.length} Selected
                  </Button>
                </motion.div>
              )}

              <Button
                variant="outlined"
                color="primary"
                startIcon={<FiRefreshCw />}
                onClick={refreshLists}
                disabled={refreshing}
                sx={{ borderRadius: 2 }}
              >
                {refreshing ? <CircularProgress size={20} /> : 'Refresh'}
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={<FiPlus />}
                onClick={() => setModal({ ...modal, create: true })}
                sx={{ borderRadius: 2 }}
              >
                Create List
              </Button>
            </ActionBar>
          </PageHeader>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => {
              setSelectedTab(newValue);
              setCurrentPage(1);
            }}
            sx={{ 
              mb: 3,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 1.5
              }
            }}
            indicatorColor="primary"
            textColor="primary"
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab 
              label="All Lists" 
              icon={isMobile ? <FiUsers /> : null}
              iconPosition="start"
            />
            <Tab 
              label="Archived Lists" 
              icon={isMobile ? <FiArchive /> : null}
              iconPosition="start"
            />
            <Tab 
              label="Active Lists" 
              icon={isMobile ? <FiCheck /> : null}
              iconPosition="start"
            />
          </Tabs>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 4
          }}>
            <SearchBox elevation={2} sx={{ flex: 1 }}>
              <FiSearch style={{ color: theme.palette.text.secondary, marginRight: 8 }} />
              <TextField
                fullWidth
                placeholder="Search lists by name, description, or tags..."
                variant="standard"
                InputProps={{ disableUnderline: true }}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <FiX />
                </IconButton>
              )}
            </SearchBox>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Toggle Filters">
                <Button
                  variant={showFilters ? "contained" : "outlined"}
                  color="primary"
                  startIcon={<FiFilter />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ borderRadius: 8, height: '100%' }}
                >
                  Filters
                </Button>
              </Tooltip>

              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  displayEmpty
                  variant="outlined"
                  size="small"
                  sx={{ borderRadius: 2, height: '100%' }}
                  startAdornment={<FiChevronDown style={{ marginRight: 8 }} />}
                >
                  <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                  <MenuItem value="created_desc">Newest First</MenuItem>
                  <MenuItem value="created_asc">Oldest First</MenuItem>
                  <MenuItem value="modified_desc">Recently Updated</MenuItem>
                  <MenuItem value="attendees_desc">Most Attendees</MenuItem>
                </Select>
              </FormControl>

              <Tooltip title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}>
                <IconButton
                  color="primary"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  sx={{ borderRadius: 2 }}
                >
                  {viewMode === 'grid' ? <FiList /> : <FiGrid />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </motion.div>

        <Collapse in={showFilters}>
          <FiltersContainer
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    label="Status"
                  >
                    <MenuItem value="all">All Lists</MenuItem>
                    <MenuItem value="active">Active Only</MenuItem>
                    <MenuItem value="archived">Archived Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  multiple
                  options={categories}
                  renderInput={(params) => <TextField {...params} label="Categories" size="small" />}
                  onChange={(e, newValue) => {
                    // Implementation for category filter
                    setCurrentPage(1);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="small"
                    onClick={() => {
                      setFilterStatus('all');
                      setCurrentPage(1);
                    }}
                    startIcon={<FiX />}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </FiltersContainer>
        </Collapse>

        <Box sx={{ mt: 3 }}>
          {viewMode === 'grid' ? renderGridView() : renderTableView()}
        </Box>

        {filteredLists.length > 0 && pageCount > 1 && (
          <motion.div
            style={{ 
              display: 'flex',
              justifyContent: 'center',
              marginTop: 32,
              marginBottom: 16
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              size="large"
            />
          </motion.div>
        )}
      </Box>

      {/* Create List Modal */}
      <Dialog
        open={modal.create}
        onClose={() => setModal({ ...modal, create: false })}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'common.white' }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Create New List</Typography>
            <IconButton onClick={() => setModal({ ...modal, create: false })} sx={{ color: 'common.white' }}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3, mt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Provide a brief description of this list's purpose..."
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                freeSolo
                options={tagOptions}
                value={formData.tags}
                onChange={(e, newValue) => setFormData({ ...formData, tags: newValue })}
                renderInput={(params) => (
                  <TextField {...params} label="Tags" margin="dense" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FiLock style={{ marginRight: 8 }} />
                <Typography>Make this list private</Typography>
              </Box>
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setModal({ ...modal, create: false })}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateList}
            disabled={!formData.name}
            sx={{ borderRadius: 2 }}
          >
            Create List
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit List Modal */}
      <Dialog
        open={modal.edit}
        onClose={() => setModal({ ...modal, edit: false })}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'common.white' }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Edit List</Typography>
            <IconButton onClick={() => setModal({ ...modal, edit: false })} sx={{ color: 'common.white' }}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 3, mt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            fullWidth
            variant="outlined"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Category</InputLabel>
                <Select
                  value={editData.category}
                  label="Category"
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                freeSolo
                options={tagOptions}
                value={editData.tags}
                onChange={(e, newValue) => setEditData({ ...editData, tags: newValue })}
                renderInput={(params) => (
                  <TextField {...params} label="Tags" margin="dense" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
          <FormControlLabel
            control={
              <Switch
                checked={editData.isPrivate}
                onChange={(e) => setEditData({ ...editData, isPrivate: e.target.checked })}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FiLock style={{ marginRight: 8 }} />
                <Typography>Make this list private</Typography>
              </Box>
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setModal({ ...modal, edit: false })}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditList}
            disabled={!editData.name}
            sx={{ borderRadius: 2 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={modal.delete}
        onClose={() => setModal({ ...modal, delete: false })}
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'common.white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FiAlertTriangle style={{ marginRight: 8 }} /> Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            Are you sure you want to delete this list? This action cannot be undone and all attendee data associated with this list will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setModal({ ...modal, delete: false })}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteList}
            sx={{ borderRadius: 2 }}
            startIcon={<FiTrash />}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={modal.bulkDelete}
        onClose={() => setModal({ ...modal, bulkDelete: false })}
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'common.white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FiAlertTriangle style={{ marginRight: 8 }} /> Confirm Bulk Delete
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            Are you sure you want to delete {selectedLists.length} selected list(s)? This action cannot be undone and all attendee data associated with these lists will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setModal({ ...modal, bulkDelete: false })}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            sx={{ borderRadius: 2 }}
            startIcon={<FiTrash />}
          >
            Delete {selectedLists.length} List(s)
          </Button>
        </DialogActions>
      </Dialog>

      {/* List Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 450 },
            p: 3
          }
        }}
      >
        {selectedList && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>
                  List Details
                </Typography>
                <IconButton onClick={() => setDrawerOpen(false)}>
                  <FiX />
                </IconButton>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>{selectedList.Name}</Typography>
                    {selectedList.IsPrivate && (
                      <Chip
                        label="Private"
                        size="small"
                        color="secondary"
                        icon={<FiLock size={14} />}
                      />
                    )}
                  </Box>

                  {selectedList.Description && (
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {selectedList.Description}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedList.Category || 'None'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Attendees
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedList.AttendeeCount || 0}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {getFormattedDate(selectedList.CreatedDate)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Modified
                    </Typography>
                    <Typography variant="body1">
                      {getRelativeTime(selectedList.LastModifiedDate)}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedList.Tags && selectedList.Tags.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedList.Tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        startIcon={<FiUsers />}
                        onClick={() => {
                          navigate(`/guestlists/manage/${selectedList.Id}`);
                          setDrawerOpen(false);
                        }}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        Manage
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        startIcon={<FiEdit />}
                        onClick={() => {
                          openEditModal(selectedList);
                          setDrawerOpen(false);
                        }}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        Edit
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        startIcon={<FiCopy />}
                        onClick={() => handleCloneList(selectedList.Id)}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        Clone
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        startIcon={selectedList.IsArchived ? <FiEye /> : <FiArchive />}
                        onClick={() => handleArchiveList(selectedList.Id, !selectedList.IsArchived)}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        {selectedList.IsArchived ? 'Unarchive' : 'Archive'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              <Box sx={{ mt: 'auto', pt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    navigate(`/guestlists/manage/${selectedList.Id}`);
                    setDrawerOpen(false);
                  }}
                  fullWidth
                  startIcon={<FiUsers />}
                  size="large"
                  sx={{ borderRadius: 2, py: 1.5 }}
                >
                  View Attendees
                </Button>
              </Box>
            </Box>
          </motion.div>
        )}
      </Drawer>

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
          sx: { borderRadius: 2, mt: 1 }
        }}
      >
        <MenuItem
          onClick={() => {
            setModal({ ...modal, bulkDelete: true });
            closeBulkMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <FiTrash />
          </ListItemIcon>
          <ListItemText>Delete Selected</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Handle bulk archive
            selectedLists.forEach(id => handleArchiveList(id, true));
            closeBulkMenu();
          }}
        >
          <ListItemIcon>
            <FiArchive />
          </ListItemIcon>
          <ListItemText>Archive Selected</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Handle bulk unarchive
            selectedLists.forEach(id => handleArchiveList(id, false));
            closeBulkMenu();
          }}
        >
          <ListItemIcon>
            <FiEye />
          </ListItemIcon>
          <ListItemText>Unarchive Selected</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (csvLinkRef.current) {
              csvLinkRef.current.link.click();
            }
            closeBulkMenu();
          }}
        >
          <ListItemIcon>
            <FiDownload />
          </ListItemIcon>
          <ListItemText>Export Selected</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={closeBulkMenu}>
          <ListItemIcon>
            <FiX />
          </ListItemIcon>
          <ListItemText>Cancel</ListItemText>
        </MenuItem>
      </Menu>

      {/* List Actions Menu */}
      <Menu
        anchorEl={moreMenuAnchorEl}
        open={Boolean(moreMenuAnchorEl)}
        onClose={handleMoreMenuClose}
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
          sx: { borderRadius: 2, mt: 1 }
        }}
      >
        <MenuItem
          onClick={() => {
            const list = lists.find(l => l.Id === activeListId);
            if (list) handleViewListDetails(list);
            handleMoreMenuClose();
          }}
        >
          <ListItemIcon>
            <FiInfo />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloneList(activeListId);
            handleMoreMenuClose();
          }}
        >
          <ListItemIcon>
            <FiCopy />
          </ListItemIcon>
          <ListItemText>Clone List</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const list = lists.find(l => l.Id === activeListId);
            if (list) handleArchiveList(activeListId, !list.IsArchived);
            handleMoreMenuClose();
          }}
        >
          <ListItemIcon>
            <FiArchive />
          </ListItemIcon>
          <ListItemText>
            {lists.find(l => l.Id === activeListId)?.IsArchived ? 'Unarchive List' : 'Archive List'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            openDeleteDialog(activeListId);
            handleMoreMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <FiTrash />
          </ListItemIcon>
          <ListItemText>Delete List</ListItemText>
        </MenuItem>
      </Menu>

      {/* CSV Export Link (hidden) */}
      {selectedLists.length > 0 && (
        <CSVLink
          data={csvData}
          filename={`attendee-lists-export-${new Date().toISOString()}.csv`}
          className="hidden"
          ref={csvLinkRef}
        />
      )}

      {/* Mobile Speed Dial */}
      {isMobile && (
        <SpeedDial
          ariaLabel="List actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
        >
          <SpeedDialAction
            icon={<FiPlus />}
            tooltipTitle="Create List"
            onClick={() => {
              setModal({ ...modal, create: true });
              setSpeedDialOpen(false);
            }}
          />
          <SpeedDialAction
            icon={<FiRefreshCw />}
            tooltipTitle="Refresh"
            onClick={() => {
              refreshLists();
              setSpeedDialOpen(false);
            }}
          />
          {selectedLists.length > 0 && (
            <SpeedDialAction
              icon={<FiTrash />}
              tooltipTitle="Delete Selected"
              onClick={() => {
                setModal({ ...modal, bulkDelete: true });
                setSpeedDialOpen(false);
              }}
            />
          )}
        </SpeedDial>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ListsPage;
