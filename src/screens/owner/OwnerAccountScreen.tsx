import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Switch,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { StackNavigationProp } from '@react-navigation/stack';

const OwnerAccountScreen: React.FC = () => {
    const { user, setUser } = useUser();
    const navigation = useNavigation();

    const [editMode, setEditMode] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const [ownerInfo, setOwnerInfo] = useState({
        name: user?.name || user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [settings, setSettings] = useState({
        notifications: true,
        emailAlerts: true,
        maintenanceReminders: true,
        reviewNotifications: true,
    });

    const [stats, setStats] = useState({
        totalRestrooms: 0,
        totalReviews: 0,
        averageRating: 0,
        monthlyVisitors: 0,
    });

    useEffect(() => {
        loadOwnerStats();
    }, []);

    const loadOwnerStats = async () => {
        try {
            if (!user || !user.email) return;

            // Get owner's restrooms
            const restrooms = await api.getOwnerRestroomsByEmail(user.email);

            // Calculate stats from restrooms data
            const totalRestrooms = restrooms.length;
            const totalReviews = restrooms.reduce((sum, r) => sum + (r.total_reviews || 0), 0);
            const averageRating = totalReviews > 0
                ? restrooms.reduce((sum, r) => sum + (r.rating || 0) * (r.total_reviews || 0), 0) / totalReviews
                : 0;
            const monthlyVisitors = restrooms.reduce((sum, r) => sum + (r.current_users || 0), 0) * 30; // Rough estimate

            setStats({
                totalRestrooms,
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10,
                monthlyVisitors,
            });
        } catch (error) {
            console.error('Error loading owner stats:', error);
        }
    };

    const saveProfile = async () => {
        try {
            // TODO: Add API endpoint to update owner profile
            // For now, just update local state and user context
            if (user) {
                const updatedUser = {
                    ...user,
                    name: ownerInfo.name,
                    email: ownerInfo.email,
                    phone: ownerInfo.phone,
                };
                setUser(updatedUser);
            }

            Alert.alert('Thành công', 'Thông tin đã được cập nhật');
            setEditMode(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
        }
    };

    const cancelEdit = () => {
        setOwnerInfo({
            name: user?.name || user?.username || '',
            email: user?.email || '',
            phone: user?.phone || '',
        });
        setEditMode(false);
    };

    const logout = () => {
        setShowLogoutModal(false);
        setUser(null);
        navigation.navigate('Login' as never);
    };

    const deleteAccount = () => {
        Alert.alert(
            'Xóa tài khoản',
            'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Call API to delete account
                        Alert.alert('Tài khoản đã được xóa', '', [
                            { text: 'OK', onPress: logout }
                        ]);
                    },
                },
            ]
        );
    };

    const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: string }) => (
        <View style={styles.statCard}>
            <Ionicons name={icon as any} size={24} color="#007AFF" />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );

    const SettingRow = ({
        title,
        description,
        value,
        onValueChange
    }: {
        title: string;
        description: string;
        value: boolean;
        onValueChange: (value: boolean) => void;
    }) => (
        <View style={styles.settingRow}>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={value ? '#007AFF' : '#f4f3f4'}
            />
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}></View>

            {/* Profile Section */}
            <View> 
                <View style={styles.profileCard}>
                    <TouchableOpacity
                        onPress={() => setEditMode(!editMode)}
                        style={styles.editButton}
                    >
                        <Text style={styles.editButtonText}>
                            {editMode ? "Hủy" : "Sửa"}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {ownerInfo.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.profileInfo}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Họ và tên</Text>
                            <TextInput
                                style={[styles.input, !editMode && styles.disabledInput]}
                                value={ownerInfo.name}
                                onChangeText={(text) => setOwnerInfo({ ...ownerInfo, name: text })}
                                editable={editMode}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, !editMode && styles.disabledInput]}
                                value={ownerInfo.email}
                                onChangeText={(text) => setOwnerInfo({ ...ownerInfo, email: text })}
                                editable={editMode}
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Số điện thoại</Text>
                            <TextInput
                                style={[styles.input, !editMode && styles.disabledInput]}
                                value={ownerInfo.phone}
                                onChangeText={(text) => setOwnerInfo({ ...ownerInfo, phone: text })}
                                editable={editMode}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {editMode && (
                            <View style={styles.editButtons}>
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={saveProfile}
                                >
                                    <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Statistics Section */}
            {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê</Text>
        <View style={styles.statsContainer}>
          <StatCard title="Nhà vệ sinh" value={stats.totalRestrooms} icon="business" />
          <StatCard title="Đánh giá" value={stats.totalReviews} icon="star" />
          <StatCard title="Điểm TB" value={stats.averageRating} icon="trending-up" />
          <StatCard title="Lượt/tháng" value={stats.monthlyVisitors} icon="people" />
        </View>
      </View> */}

            {/* Settings Section */}
            {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt thông báo</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            title="Thông báo push"
            description="Nhận thông báo trên thiết bị"
            value={settings.notifications}
            onValueChange={(value) => setSettings({...settings, notifications: value})}
          />
          <SettingRow
            title="Thông báo email"
            description="Nhận thông báo qua email"
            value={settings.emailAlerts}
            onValueChange={(value) => setSettings({...settings, emailAlerts: value})}
          />
          <SettingRow
            title="Nhắc nhở bảo trì"
            description="Thông báo lịch bảo trì định kỳ"
            value={settings.maintenanceReminders}
            onValueChange={(value) => setSettings({...settings, maintenanceReminders: value})}
          />
          <SettingRow
            title="Thông báo đánh giá"
            description="Nhận thông báo khi có đánh giá mới"
            value={settings.reviewNotifications}
            onValueChange={(value) => setSettings({...settings, reviewNotifications: value})}
          />
        </View>
      </View> */}

            {/* Actions Section */}
            {/* <View style={styles.section}> */}
            <View>
                {/* <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Hỗ trợ', 'Liên hệ support@restroomfinder.com')}
        >
          <Ionicons name="help-circle" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Hỗ trợ & Trợ giúp</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Điều khoản', 'Điều khoản sử dụng dịch vụ')}
        >
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Điều khoản sử dụng</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity> */}

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowLogoutModal(true)}
                >
                    <Ionicons name="log-out" size={24} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Đăng xuất</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* <TouchableOpacity 
          style={styles.actionButton}
          onPress={deleteAccount}
        >
          <Ionicons name="trash" size={24} color="#FF3B30" />
          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Xóa tài khoản</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity> */}
            </View>

            {/* Logout Confirmation Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showLogoutModal}
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Đăng xuất</Text>
                        <Text style={styles.modalMessage}>
                            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={logout}
                            >
                                <Text style={styles.modalConfirmText}>Đăng xuất</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingVertical: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 10,
        backgroundColor: '#f8f9fa',
        // borderBottomWidth: 1,
        // borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButtonText: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '400',
        marginLeft: 4,
    },
    // section: {
    // },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    profileCard: {
        backgroundColor: '#f8f9fa',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 20,
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.1,
        // shadowRadius: 4,
        // elevation: 3,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    userTypeLabel: {
        backgroundColor: '#34C759',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    userTypeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    disabledInput: {
        backgroundColor: '#f0f0f0',
        color: '#666',
    },
    editButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: '#ccc',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    statCard: {
        backgroundColor: 'white',
        width: '48%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 4,
    },
    statTitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    settingsCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#',
        marginHorizontal: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 20,
        marginHorizontal: 40,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalCancelButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
    },
    modalCancelText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    modalConfirmButton: {
        backgroundColor: '#FF9500',
        paddingHorizontal: 24,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
    },
    modalConfirmText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default OwnerAccountScreen;