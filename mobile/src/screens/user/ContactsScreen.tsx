import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Phone,
  Edit2,
  Trash2,
  Plus,
  X,
  User,
  Users as UsersIcon,
  Shield,
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '../../api/client';
import { colors, fontSize, spacing } from '../../styles/theme';
import { EmergencyContact } from '../../types';

const DEFAULT_CONTACTS = [
  { name: 'Police', number: '100', icon: Shield, color: colors.primary[600] },
  { name: 'Ambulance', number: '108', icon: Phone, color: '#10b981' },
  { name: 'Fire', number: '101', icon: Shield, color: '#f97316' },
  { name: 'Women Helpline', number: '1091', icon: UsersIcon, color: '#a855f7' },
];

const ContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    relationship: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await getEmergencyContacts();
      setContacts(response.contacts || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', phone_number: '', relationship: '' });
    setModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      relationship: contact.relationship,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingContact(null);
    setFormData({ name: '', phone_number: '', relationship: '' });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone_number.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!formData.relationship.trim()) {
      Alert.alert('Error', 'Please enter a relationship');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (editingContact) {
        await updateEmergencyContact(editingContact.id, formData);
      } else {
        await addEmergencyContact(formData);
      }
      await loadContacts();
      closeModal();
      Alert.alert('Success', `Contact ${editingContact ? 'updated' : 'added'} successfully`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmergencyContact(contact.id);
              await loadContacts();
              Alert.alert('Success', 'Contact deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Contacts</Text>
          <Text style={styles.subtitle}>Manage your emergency contact list</Text>
        </View>

        {/* Default Emergency Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Services</Text>
          {DEFAULT_CONTACTS.map((contact, index) => {
            const Icon = contact.icon;
            return (
              <View key={index} style={styles.defaultContactCard}>
                <View style={styles.contactInfo}>
                  <View style={[styles.iconCircle, { backgroundColor: contact.color + '20' }]}>
                    <Icon color={contact.color} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactNumber}>{contact.number}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.callButton, {backgroundColor: contact.color}]}
                  onPress={() => handleCall(contact.number)}
                >
                  <Phone color="#fff" size={20} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* User's Custom Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Contacts</Text>
            {contacts.length < 3 && (
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Plus color={colors.primary[500]} size={20} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.contactLimit}>You can add up to 3 emergency contacts</Text>

          {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <User color={colors.dark[500]} size={48} />
              <Text style={styles.emptyText}>No emergency contacts added yet</Text>
              <TouchableOpacity style={styles.emptyAddButton} onPress={openAddModal}>
                <Text style={styles.emptyAddButtonText}>Add Your First Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary[500] + '20' }]}>
                    <User color={colors.primary[500]} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactNumber}>{contact.phone_number}</Text>
                    <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                  </View>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleCall(contact.phone_number)}
                  >
                    <Phone color={colors.success[500]} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => openEditModal(contact)}
                  >
                    <Edit2 color={colors.primary[500]} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(contact)}
                  >
                    <Trash2 color={colors.error[500]} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Contact Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X color={colors.dark[400]} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name"
                  placeholderTextColor={colors.dark[500]}
                  value={formData.name}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor={colors.dark[500]}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={formData.phone_number}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, phone_number: text.replace(/\D/g, '') }))
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mother, Father, Friend"
                  placeholderTextColor={colors.dark[500]}
                  value={formData.relationship}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, relationship: text }))}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark[950],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.dark[950],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.dark[400],
    marginTop: spacing.md,
    fontSize: fontSize.base,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[800],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.dark[400],
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.md,
  },
  contactLimit: {
    fontSize: fontSize.sm,
    color: colors.dark[500],
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  addButtonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  defaultContactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark[800],
    borderWidth: 1,
    borderColor: colors.dark[700],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.dark[500],
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyAddButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.dark[900],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[800],
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#fff',
  },
  form: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.dark[800],
    borderWidth: 1,
    borderColor: colors.dark[700],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.dark[800],
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary[600],
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});

export default ContactsScreen;
