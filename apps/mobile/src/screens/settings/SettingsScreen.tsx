import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/auth-store';

export function SettingsScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Security</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>About</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  profileSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '600' },
  name: { fontSize: 20, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  email: { fontSize: 14, color: '#666' },
  menuSection: { backgroundColor: '#fff', marginTop: 16 },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuText: { fontSize: 16, color: '#1a1a1a' },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
});
