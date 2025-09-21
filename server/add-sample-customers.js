const { supabase } = require('./index');

async function addSampleCustomers() {
  console.log('🔄 Adding sample customers...');
  
  const sampleCustomers = [
    {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+1-555-0101',
      address: '123 Main Street, Springfield, IL 62701',
      frequency: 'weekly'
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah@example.com', 
      phone: '+1-555-0102',
      address: '456 Oak Avenue, Springfield, IL 62702',
      frequency: 'biweekly'
    },
    {
      name: 'Mike Davis',
      email: 'mike@example.com',
      phone: '+1-555-0103',
      address: '789 Pine Road, Springfield, IL 62703', 
      frequency: 'monthly'
    }
  ];

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(sampleCustomers)
      .select();

    if (error) {
      console.error('❌ Error adding customers:', error);
      return;
    }

    console.log('✅ Successfully added customers:');
    data.forEach(customer => {
      console.log(`  - ${customer.name} (${customer.address})`);
    });

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

// Check existing customers first
async function checkCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching customers:', error);
      return;
    }

    console.log('📊 Current customers in database:');
    if (data.length === 0) {
      console.log('  No customers found. Adding sample data...');
      await addSampleCustomers();
    } else {
      data.forEach(customer => {
        console.log(`  - ${customer.name} (${customer.address})`);
      });
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

checkCustomers();
