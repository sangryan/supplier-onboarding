import api from './api';

/**
 * Check if supplier profile information is complete
 * @param {Object} supplier - Supplier data object
 * @param {Object} user - User data object
 * @returns {boolean} - True if all required information is filled
 */
export const isSupplierProfileComplete = (supplier, user) => {
  if (!user || user.role !== 'supplier') {
    return true; // Non-suppliers don't need profile check
  }

  if (!supplier) {
    return false; // No supplier data means profile is incomplete
  }

  // Check contact information
  const authorizedPerson = supplier.authorizedPerson;
  const contactComplete = 
    authorizedPerson?.name &&
    authorizedPerson?.relationship &&
    authorizedPerson?.idPassportNumber &&
    authorizedPerson?.phone &&
    authorizedPerson?.email;

  // Check company information
  const address = supplier.companyPhysicalAddress;
  const fullAddress = address
    ? `${address.street || ''}, ${address.city || ''}, ${address.country || ''}${address.postalCode ? `, ${address.postalCode}` : ''}`.replace(/^,\s*|,\s*$/g, '')
    : supplier.physicalAddress || '';

  const companyComplete = 
    supplier.supplierName &&
    (supplier.registeredCountry || address?.country) &&
    supplier.companyRegistrationNumber &&
    supplier.companyEmail &&
    supplier.legalNature &&
    fullAddress;

  return contactComplete && companyComplete;
};

/**
 * Fetch supplier data and check if profile is complete
 * @param {Object} user - User data object
 * @returns {Promise<boolean>} - True if profile is complete
 */
export const checkSupplierProfileComplete = async (user) => {
  if (!user || user.role !== 'supplier') {
    return true; // Non-suppliers don't need profile check
  }

  try {
    const response = await api.get('/suppliers');
    const suppliers = response.data.data || [];
    
    if (suppliers.length === 0) {
      return false; // No supplier data means profile is incomplete
    }

    const supplier = suppliers[0];
    return isSupplierProfileComplete(supplier, user);
  } catch (error) {
    console.error('Error checking supplier profile:', error);
    return false; // On error, assume incomplete
  }
};

