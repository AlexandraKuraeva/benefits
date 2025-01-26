'use server';

import { z } from 'zod';
import { supabase } from './data'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(['pending', 'paid']),
  date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {

	 const { customerId, amount, status } = CreateInvoice.parse({

    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
		
  });

	const amountInCents = amount * 100;
	const date = new Date().toISOString().split('T')[0];

	 await supabase
	.from('invoices')
	.insert({
		customer_id: customerId,
		amount: amountInCents,
		status: status,
		date: date
	})

	revalidatePath('/dashboard/invoices')
	redirect('/dashboard/invoices')
}



const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
	const { customerId, amount, status } = UpdateInvoice.parse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	})

	

	const amountInCents = amount * 100;

	const { error } = await supabase
  .from('invoices')
  .update({ 
		customer_id: customerId,
		amount: amountInCents,
		status: status
	 })
  .eq('id', id)
	

	if (error) {
		console.error('Database Error:', error)
		throw new Error('Failed to update invoice.')
	}
	
	revalidatePath('/dashboard/invoices')
	redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
	const response = await supabase
		.from('invoices')
		.delete()
		.eq('id', id)

	if (response.error) {
		console.error('Database Error:', response.error)
		throw new Error('Failed to delete invoice.')
	}

	revalidatePath('/dashboard/invoices')
}