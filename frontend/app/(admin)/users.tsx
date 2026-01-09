import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { COLORS } from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UsersScreen() {
  const { user } = useAuth();
  const { getAllUsers, blockUser, unblockUser, deleteUser } = useAdmin();
  
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'merchant'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [userDetailsModalVisible, setUserDetailsModalVisible] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterRole, filterStatus]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      const filteredList = allUsers.filter(u => u.role !== 'admin');
      setUsers(filteredList);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.studentId?.toLowerCase().includes(query) ||
        u.merchantId?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleBlockUser = (selectedUser: any) => {
    setSelectedUser(selectedUser);
    setBlockModalVisible(true);
  };

  const confirmBlock = async () => {
    if (!selectedUser || !blockReason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }

    try {
      await blockUser(selectedUser.email, blockReason, user?.email || 'admin');
      setBlockModalVisible(false);
      setBlockReason('');
      setSelectedUser(null);
      loadUsers();
      Alert.alert('✅ Success', `${selectedUser.name} has been blocked`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUnblockUser = (userToUnblock: any) => {
    Alert.alert(
      'Unblock User',
      `Unblock ${userToUnblock.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(userToUnblock.email, user?.email || 'admin');
              loadUsers();
              Alert.alert('✅ Success', `${userToUnblock.name} has been unblocked`);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (userToDelete: any) => {
    Alert.alert(
      '⚠️ Delete User',
      `Permanently delete ${userToDelete.name}?\n\nThis will:\n• Remove user account\n• Delete wallet data\n• Cannot be undone`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userToDelete.email, user?.email || 'admin');
              loadUsers();
              Alert.alert('✅ Deleted', `${userToDelete.name} has been removed`);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const showUserDetails = async (userData: any) => {
    try {
      let balance = 0;
      let transactionCount = 0;

      if (userData.role === 'student') {
        const walletData = await AsyncStorage.getItem(`WALLET_${userData.email}`);
        if (walletData) {
          const { balance: bal, transactions } = JSON.parse(walletData);
          balance = bal;
          transactionCount = transactions?.length || 0;
        }
      } else if (userData.role === 'merchant') {
        const walletData = await AsyncStorage.getItem(`MERCHANT_WALLET_${userData.email}`);
        if (walletData) {
          const { balance: bal, transactions } = JSON.parse(walletData);
          balance = bal;
          transactionCount = transactions?.length || 0;
        }
      }

      setUserDetails({
        ...userData,
        balance,
        transactionCount,
      });
      setUserDetailsModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => showUserDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userHeader}>
        <View style={[
          styles.roleIcon,
          { backgroundColor: item.role === 'student' ? COLORS.student + '20' : COLORS.merchant + '20' }
        ]}>
          <Ionicons
            name={item.role === 'student' ? 'school' : 'storefront'}
            size={24}
            color={item.role === 'student' ? COLORS.student : COLORS.merchant}
          />
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            {item.status === 'blocked' && (
              <View style={styles.blockedBadge}>
                <Ionicons name="ban" size={10} color="#fff" />
                <Text style={styles.blockedText}>BLOCKED</Text>
              </View>
            )}
            {item.status === 'active' && (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark" size={10} color="#fff" />
                <Text style={styles.activeText}>ACTIVE</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.role === 'student' && (
            <Text style={styles.userId}>ID: {item.studentId}</Text>
          )}
          {item.role === 'merchant' && (
            <Text style={styles.userId}>ID: {item.merchantId} • {item.merchantName}</Text>
          )}
          {item.status === 'blocked' && item.blockReason && (
            <Text style={styles.blockReason}>🚫 {item.blockReason}</Text>
          )}
          <Text style={styles.userDate}>
            Joined: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </View>

      <View style={styles.userActions}>
        {item.status === 'active' ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.blockBtn]}
            onPress={() => handleBlockUser(item)}
          >
            <Ionicons name="ban" size={18} color={COLORS.danger} />
            <Text style={styles.blockBtnText}>Block</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.unblockBtn]}
            onPress={() => handleUnblockUser(item)}
          >
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.unblockBtnText}>Unblock</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeleteUser(item)}
        >
          <Ionicons name="trash" size={18} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>{filteredUsers.length} users found</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Role:</Text>
        <TouchableOpacity
          style={[styles.filterChip, filterRole === 'all' && styles.filterChipActive]}
          onPress={() => setFilterRole('all')}
        >
          <Text style={[styles.filterText, filterRole === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterRole === 'student' && styles.filterChipActive]}
          onPress={() => setFilterRole('student')}
        >
          <Ionicons name="school" size={14} color={filterRole === 'student' ? '#fff' : COLORS.student} />
          <Text style={[styles.filterText, filterRole === 'student' && styles.filterTextActive]}>
            Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterRole === 'merchant' && styles.filterChipActive]}
          onPress={() => setFilterRole('merchant')}
        >
          <Ionicons name="storefront" size={14} color={filterRole === 'merchant' ? '#fff' : COLORS.merchant} />
          <Text style={[styles.filterText, filterRole === 'merchant' && styles.filterTextActive]}>
            Merchants
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status:</Text>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
          onPress={() => setFilterStatus('active')}
        >
          <Ionicons name="checkmark" size={14} color={filterStatus === 'active' ? '#fff' : COLORS.success} />
          <Text style={[styles.filterText, filterStatus === 'active' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'blocked' && styles.filterChipActive]}
          onPress={() => setFilterStatus('blocked')}
        >
          <Ionicons name="ban" size={14} color={filterStatus === 'blocked' ? '#fff' : COLORS.danger} />
          <Text style={[styles.filterText, filterStatus === 'blocked' && styles.filterTextActive]}>
            Blocked
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Block User Modal */}
      <Modal
        visible={blockModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="ban" size={32} color={COLORS.danger} />
              <Text style={styles.modalTitle}>Block User</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Blocking {selectedUser?.name}
            </Text>
            <Text style={styles.modalWarning}>
              ⚠️ User will not be able to login until unblocked
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for blocking..."
              value={blockReason}
              onChangeText={setBlockReason}
              multiline
              numberOfLines={4}
              placeholderTextColor={COLORS.textLight}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setBlockModalVisible(false);
                  setBlockReason('');
                  setSelectedUser(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmBlock}
              >
                <Text style={styles.modalConfirmText}>Block User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Details Modal */}
      <Modal
        visible={userDetailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUserDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailsHeader}>
              <View style={[
                styles.detailsIcon,
                { backgroundColor: userDetails?.role === 'student' ? COLORS.student : COLORS.merchant }
              ]}>
                <Ionicons
                  name={userDetails?.role === 'student' ? 'school' : 'storefront'}
                  size={32}
                  color="#fff"
                />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setUserDetailsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.detailsName}>{userDetails?.name}</Text>
            <Text style={styles.detailsEmail}>{userDetails?.email}</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
                <Text style={styles.detailLabel}>Joined</Text>
                <Text style={styles.detailValue}>
                  {userDetails && new Date(userDetails.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailCard}>
                <Ionicons name="wallet" size={20} color={COLORS.success} />
                <Text style={styles.detailLabel}>Balance</Text>
                <Text style={styles.detailValue}>₹{userDetails?.balance || 0}</Text>
              </View>

              <View style={styles.detailCard}>
                <Ionicons name="receipt" size={20} color={COLORS.warning} />
                <Text style={styles.detailLabel}>Transactions</Text>
                <Text style={styles.detailValue}>{userDetails?.transactionCount || 0}</Text>
              </View>

              <View style={styles.detailCard}>
                <Ionicons 
                  name={userDetails?.status === 'active' ? 'checkmark-circle' : 'ban'} 
                  size={20} 
                  color={userDetails?.status === 'active' ? COLORS.success : COLORS.danger} 
                />
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>
                  {userDetails?.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            {userDetails?.role === 'student' && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Student ID</Text>
                <Text style={styles.infoValue}>{userDetails.studentId}</Text>
              </View>
            )}

            {userDetails?.role === 'merchant' && (
              <>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Merchant ID</Text>
                  <Text style={styles.infoValue}>{userDetails.merchantId}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Business Name</Text>
                  <Text style={styles.infoValue}>{userDetails.merchantName}</Text>
                </View>
              </>
            )}

            {userDetails?.blockReason && (
              <View style={styles.blockReasonCard}>
                <Ionicons name="information-circle" size={20} color={COLORS.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockReasonLabel}>Block Reason</Text>
                  <Text style={styles.blockReasonText}>{userDetails.blockReason}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.admin,
    borderColor: COLORS.admin,
  },
  filterText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  userCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  blockedText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  activeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  blockReason: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
    fontStyle: 'italic',
  },
  userDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  blockBtn: {
    backgroundColor: COLORS.danger + '20',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  blockBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },
  unblockBtn: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  unblockBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  deleteBtn: {
    backgroundColor: COLORS.danger + '10',
    borderWidth: 1,
    borderColor: COLORS.danger + '50',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalWarning: {
    fontSize: 14,
    color: COLORS.warning,
    marginBottom: 20,
    textAlign: 'center',
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalConfirmBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  detailsEmail: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  blockReasonCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.danger + '10',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    marginTop: 8,
  },
  blockReasonLabel: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
    marginBottom: 4,
  },
  blockReasonText: {
    fontSize: 14,
    color: COLORS.text,
  },
});
