import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { User, Mail, Phone, Bell, Lock, Globe, LogOut, Save, Edit2 } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { updateUserProfile } from '../../api/client';
import { colors, fontSize, spacing } from '../../styles/theme';

const SettingsScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: true,
    shareLocation: true,
  });

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await updateUserProfile(profileData);
      updateUser(response.user);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Edit2 color={colors.primary[500]} size={20} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.inputRow}>
              <User color={colors.dark[400]} size={20} />
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={profileData.name}
                    onChangeText={(text) => setProfileData((prev) => ({ ...prev, name: text }))}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.dark[500]}
                  />
                ) : (
                  <Text style={styles.inputValue}>{user?.name || 'Not set'}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputRow}>
              <Mail color={colors.dark[400]} size={20} />
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={profileData.email}
                    onChangeText={(text) => setProfileData((prev) => ({ ...prev, email: text }))}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.dark[500]}
                    keyboardType="email-address"
                  />
                ) : (
                  <Text style={styles.inputValue}>{user?.email || 'Not set'}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputRow}>
              <Phone color={colors.dark[400]} size={20} />
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Mobile</Text>
                <Text style={[styles.inputValue, { color: colors.dark[500] }]}>{user?.mobile}</Text>
              </View>
            </View>

            {editing && (
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Save color="#fff" size={16} /><Text style={styles.saveBtnText}>Save</Text></>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Bell color={colors.dark[400]} size={20} />
                <View>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDesc}>Receive instant alerts</Text>
                </View>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={() => toggleSetting('pushNotifications')}
                trackColor={{ false: colors.dark[700], true: colors.primary[600] }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Mail color={colors.dark[400]} size={20} />
                <View>
                  <Text style={styles.settingLabel}>Email Notifications</Text>
                  <Text style={styles.settingDesc}>Get updates via email</Text>
                </View>
              </View>
              <Switch
                value={settings.emailNotifications}
                onValueChange={() => toggleSetting('emailNotifications')}
                trackColor={{ false: colors.dark[700], true: colors.primary[600] }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Lock color={colors.dark[400]} size={20} />
                <View>
                  <Text style={styles.settingLabel}>Share Location</Text>
                  <Text style={styles.settingDesc}>Allow location access for emergencies</Text>
                </View>
              </View>
              <Switch
                value={settings.shareLocation}
                onValueChange={() => toggleSetting('shareLocation')}
                trackColor={{ false: colors.dark[700], true: colors.primary[600] }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.card}>
            <View style={styles.languageRow}>
              <Globe color={colors.dark[400]} size={20} />
              <TouchableOpacity
                style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}
                onPress={() => setLanguage('hi')}
              >
                <Text style={[styles.langBtnText, language === 'hi' && styles.langBtnTextActive]}>Hindi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color={colors.error[500]} size={20} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark[950] },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.dark[800] },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: '#fff', marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.base, color: colors.dark[400] },
  section: { padding: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: '#fff', marginBottom: spacing.md },
  card: { backgroundColor: colors.dark[900], borderWidth: 1, borderColor: colors.dark[800], borderRadius: 12, padding: spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.dark[800] },
  inputWrapper: { flex: 1, marginLeft: spacing.md },
  inputLabel: { fontSize: fontSize.xs, color: colors.dark[500], marginBottom: 4 },
  inputValue: { fontSize: fontSize.base, color: '#fff' },
  input: { fontSize: fontSize.base, color: '#fff', backgroundColor: colors.dark[800], borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  editActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md },
  cancelBtn: { flex: 1, backgroundColor: colors.dark[800], paddingVertical: spacing.md, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: '600' },
  saveBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.primary[600], paddingVertical: spacing.md, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.dark[800] },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  settingLabel: { fontSize: fontSize.base, color: '#fff', fontWeight: '600' },
  settingDesc: { fontSize: fontSize.sm, color: colors.dark[500] },
  languageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  langBtn: { flex: 1, backgroundColor: colors.dark[800], paddingVertical: spacing.md, borderRadius: 8, alignItems: 'center' },
  langBtnActive: { backgroundColor: colors.primary[600] },
  langBtnText: { color: colors.dark[400], fontWeight: '600' },
  langBtnTextActive: { color: '#fff' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.error[500] + '20', borderWidth: 1, borderColor: colors.error[500], paddingVertical: spacing.md, borderRadius: 12 },
  logoutBtnText: { color: colors.error[500], fontSize: fontSize.base, fontWeight: '600' },
});

export default SettingsScreen;
