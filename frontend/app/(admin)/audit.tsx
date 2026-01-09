import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../hooks/useAdmin';
import { COLORS } from '../../constants/Config';

export default function AuditScreen() {
  const { getAdminActions } = useAdmin();
  
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'BLOCK_USER' | 'UNBLOCK_USER' | 'REVERSE_TRANSACTION' | 'MARK_FRAUD' | 'CLEAR_FRAUD'>('all');
  const [filteredActions, setFilteredActions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    blocks: 0,
    unblocks: 0,
    reversals: 0,
    fraudMarks: 0,
  });

  useEffect(() => {
    loadAuditLog();
  }, []);

  useEffect(() => {
    filterActions();
    calculateStats();
  }, [actions, filterType]);

  const loadAuditLog = async () => {
    setLoading(true);
    try {
      const log = await getAdminActions();
      setActions(log);
    } catch (error) {
      console.error('Load audit log error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActions = () => {
    if (filterType === 'all') {
      setFilteredActions(actions);
    } else {
      setFilteredActions(actions.filter(a => a.actionType === filterType));
    }
  };

  const calculateStats = () => {
    const blocks = actions.filter(a => a.actionType === 'BLOCK_USER').length;
    const unblocks = actions.filter(a => a.actionType === 'UNBLOCK_USER').length;
    const reversals = actions.filter(a => a.actionType === 'REVERSE_TRANSACTION').length;
    const fraudMarks = actions.filter(a => a.actionType === 'MARK_FRAUD').length;

    setStats({
      totalActions: actions.length,
      blocks,
      unblocks,
      reversals,
      fraudMarks,
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'BLOCK_USER':
        return { name: 'ban', color: COLORS.danger };
      case 'UNBLOCK_USER':
        return { name: 'checkmark-circle', color: COLORS.success };
      case 'REVERSE_TRANSACTION':
        return { name: 'refresh', color: COLORS.warning };
      case 'MARK_FRAUD':
        return { name: 'warning', color: COLORS.danger };
      case 'CLEAR_FRAUD':
        return { name: 'shield-checkmark', color: COLORS.success };
      default:
        return { name: 'information-circle', color: COLORS.primary };
    }
  };

  const getActionTitle = (actionType: string) => {
    return actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderAction = ({ item }: { item: any }) => {
    const icon = getActionIcon(item.actionType);

    return (
      <View style={styles.actionCard}>
        <View style={[styles.actionIconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>

        <View style={styles.actionContent}>
          <View style={styles.actionHeader}>
            <Text style={styles.actionTitle}>{getActionTitle(item.actionType)}</Text>
            <Text style={styles.actionTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>

          <Text style={styles.actionAdmin}>👤 Admin: {item.adminEmail}</Text>

          {item.targetEmail && (
            <View style={styles.targetInfo}>
              <Ionicons name="person" size={14} color={COLORS.textLight} />
              <Text style={styles.actionTarget}>User: {item.targetEmail}</Text>
            </View>
          )}

          {item.targetTransactionId && (
            <View style={styles.targetInfo}>
              <Ionicons name="receipt" size={14} color={COLORS.textLight} />
              <Text style={styles.actionTarget}>Txn: {item.targetTransactionId}</Text>
            </View>
          )}

          <View style={styles.reasonContainer}>
            <Ionicons name="document-text" size={14} color={COLORS.primary} />
            <Text style={styles.actionReason}>{item.reason}</Text>
          </View>

          <Text style={styles.actionDate}>
            📅 {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Log</Text>
        <Text style={styles.subtitle}>{filteredActions.length} admin actions</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalActions}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.blocks}</Text>
          <Text style={styles.statLabel}>Blocks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.reversals}</Text>
          <Text style={styles.statLabel}>Reversals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.fraudMarks}</Text>
          <Text style={styles.statLabel}>Fraud</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'BLOCK_USER' && styles.filterChipActive]}
          onPress={() => setFilterType('BLOCK_USER')}
        >
          <Ionicons name="ban" size={14} color={filterType === 'BLOCK_USER' ? '#fff' : COLORS.danger} />
          <Text style={[styles.filterText, filterType === 'BLOCK_USER' && styles.filterTextActive]}>
            Blocks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'REVERSE_TRANSACTION' && styles.filterChipActive]}
          onPress={() => setFilterType('REVERSE_TRANSACTION')}
        >
          <Ionicons name="refresh" size={14} color={filterType === 'REVERSE_TRANSACTION' ? '#fff' : COLORS.warning} />
          <Text style={[styles.filterText, filterType === 'REVERSE_TRANSACTION' && styles.filterTextActive]}>
            Reversals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'MARK_FRAUD' && styles.filterChipActive]}
          onPress={() => setFilterType('MARK_FRAUD')}
        >
          <Ionicons name="warning" size={14} color={filterType === 'MARK_FRAUD' ? '#fff' : COLORS.danger} />
          <Text style={[styles.filterText, filterType === 'MARK_FRAUD' && styles.filterTextActive]}>
            Fraud
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredActions}
        renderItem={renderAction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAuditLog} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No admin actions yet</Text>
            <Text style={styles.emptySubtext}>Actions will appear here as they occur</Text>
          </View>
        }
      />
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
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
    padding: 16,
    paddingTop: 4,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  actionTime: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  actionAdmin: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  actionTarget: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  reasonContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 6,
    gap: 6,
    alignItems: 'flex-start',
  },
  actionReason: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  actionDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
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
});
