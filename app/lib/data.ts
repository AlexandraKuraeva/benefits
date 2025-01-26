import { createClient } from '@supabase/supabase-js'
import { formatCurrency } from './utils'

export const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
)

export async function fetchCustomers() {
	try {
		const { data, error } = await supabase
			.from('customers')
			.select('id, name')
			.order('name', { ascending: true })

		if (error) throw error

		const customers = data
		return customers
	} catch (err) {
		console.error('Database Error:', err)
		throw new Error('Failed to fetch all customers.')
	}
}

export async function fetchRevenue() {
	try {
		console.log('Fetching revenue data...')
		await new Promise(resolve => setTimeout(resolve, 3000))

		const { data, error } = await supabase.from('revenue').select()

		if (error) throw error

		return data
	} catch (error) {
		console.error('Database Error:', error)
		throw new Error('Failed to fetch revenue data.')
	}
}

export async function fetchLatestInvoices() {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.select(
				` amount, customers (
          name,
          image_url,
          email ) 
        `
			)

			.order('date', { ascending: false })
			.limit(5)

		if (error) throw error
		console.log(data)
		const latestInvoices = data.map(invoice => ({
			...invoice,
			amount: formatCurrency(invoice.amount),
		}))

		return data
	} catch (error) {
		console.error('Database Error:', error)
		throw new Error('Failed to fetch the latest invoices.')
	}
}

export async function fetchCardData() {
	try {
		const [
			invoiceCount,
			customerCount,
			//invoiceStatus
		] = await Promise.all([
			supabase
				.from('invoices')
				.select('*', { count: 'exact', head: true })
				.then(data => data.count),
			supabase
				.from('customers')
				.select('*', { count: 'exact', head: true })
				.then(data => data.count),
			//  supabase
			//    .from('invoices')
			//    .select(
			//       `  paid: SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END),
			//         pending: SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END)`
			//    )
			//    .then(( data ) => data),
		])

		const numberOfInvoices = Number(invoiceCount ?? '0')
		const numberOfCustomers = Number(customerCount ?? '0')
		// const totalPaidInvoices = formatCurrency(invoiceStatus.paid ?? '0');
		// const totalPendingInvoices = formatCurrency(invoiceStatus.pending ?? '0');

		return {
			numberOfCustomers,
			numberOfInvoices,
			// totalPaidInvoices,
			// totalPendingInvoices,
		}
	} catch (error) {
		console.error('Database Error:', error)
		throw new Error('Failed to fetch card data.')
	}
}


export async function fetchFilteredInvoices(
	query: string,
) {

	try {
		const { data, error } = await supabase

			.from('invoices')
			.select(
				` id,
					amount, 
          date, 
          status, 
          customers(
            name, 
            email, 
            image_url
           )
           `
			)

			.ilike('customers.name', `%${query}%`)
			.not('customers', 'is', null)
      .order('date', { ascending: false })
     

      if (error) throw error;
		if (error) throw error

		return data
	} catch (error) {
		console.error('Database Error:', error)
		throw new Error('Failed to fetch invoices.')
	}
}

export async function fetchInvoicesPages(query: string): Promise<Invoice[]> {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.select('count(*)')
			.textSearch('customers.name', query)
		// .or('customers.email.ilike', `%${query}%`)
		// .or('invoices.amount::text.ilike', `%${query}%`)
		// .or('invoices.date::text.ilike', `%${query}%`)
		// .or('invoices.status.ilike', `%${query}%`);

		if (error) throw error

		const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE)
		return data
	} catch (error) {
		console.error('Database Error:', error)
		throw new Error('Failed to fetch total number of invoices.')
	}
}

export async function fetchInvoiceById(id: string) {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.select('id, customer_id, amount, status')
			.eq('id', id)
			.single()

		if (error) throw error

		const invoice = {
			...data,
			// Convert amount from cents to dollars
			amount: data.amount / 100,
		}

		return invoice
	} catch (error) {
		console.error('Database Error:', error)
		throw new Error('Failed to fetch invoice.')
	}
}

export async function fetchFilteredCustomers(query: string) {
	try {
		const { data, error } = await supabase
			.from('customers')
			.select(
				'id, name, email, image_url, total_invoices, total_pending, total_paid'
			)
			.join('invoices', 'customer_id', 'id', {
				foreignTable: 'invoices',
				select: 'amount, status',
			})
			.textSearch('name', query)
			.or('email.ilike', `%${query}%`)
			.group('id, name, email, image_url')
			.order('name', { ascending: true })

		if (error) throw error

		const customers = data.map(customer => ({
			...customer,
			total_pending: formatCurrency(customer.total_pending),
			total_paid: formatCurrency(customer.total_paid),
		}))

		return customers
	} catch (err) {
		console.error('Database Error:', err)
		throw new Error('Failed to fetch customer table.')
	}
}
