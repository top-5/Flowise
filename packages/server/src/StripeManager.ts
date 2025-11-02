// @ts-nocheck
import Stripe from 'stripe'
import { Request } from 'express'
import { UsageCacheManager } from './UsageCacheManager'
// @ts-nocheck
import { UserPlan } from './Interface'
// @ts-nocheck
import { LICENSE_QUOTAS } from './utils/constants'
// @ts-nocheck

// @ts-nocheck
export class StripeManager {
    // @ts-nocheck
    private static instance: StripeManager
    // @ts-nocheck
    private stripe?: Stripe
    // @ts-nocheck
    private cacheManager: UsageCacheManager
    // @ts-nocheck

    // @ts-nocheck
    public static async getInstance(): Promise<StripeManager> {
        // @ts-nocheck
        if (!StripeManager.instance) {
            // @ts-nocheck
            StripeManager.instance = new StripeManager()
            // @ts-nocheck
            await StripeManager.instance.initialize()
            // @ts-nocheck
        }
        // @ts-nocheck
        return StripeManager.instance
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    private async initialize() {
        // @ts-nocheck
        if (!this.stripe && process.env.STRIPE_SECRET_KEY) {
            // @ts-nocheck
            this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
            // @ts-nocheck
        }
        // @ts-nocheck
        this.cacheManager = await UsageCacheManager.getInstance()
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public getStripe() {
        // @ts-nocheck
        if (!this.stripe) throw new Error('Stripe is not initialized')
        // @ts-nocheck
        return this.stripe
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public getSubscriptionObject(subscription: Stripe.Response<Stripe.Subscription>) {
        // @ts-nocheck
        return {
            // @ts-nocheck
            customer: subscription.customer,
            // @ts-nocheck
            status: subscription.status,
            // @ts-nocheck
            created: subscription.created
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async getProductIdFromSubscription(subscriptionId: string) {
        // @ts-nocheck
        if (!subscriptionId || subscriptionId.trim() === '') {
            // @ts-nocheck
            return ''
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        if (!this.stripe) {
            // @ts-nocheck
            throw new Error('Stripe is not initialized')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        const subscriptionData = await this.cacheManager.getSubscriptionDataFromCache(subscriptionId)
        // @ts-nocheck
        if (subscriptionData?.productId) {
            // @ts-nocheck
            return subscriptionData.productId
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        try {
            // @ts-nocheck
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
            // @ts-nocheck
            const items = subscription.items.data
            // @ts-nocheck
            if (items.length === 0) {
                // @ts-nocheck
                return ''
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            const productId = items[0].price.product as string
            // @ts-nocheck
            await this.cacheManager.updateSubscriptionDataToCache(subscriptionId, {
                // @ts-nocheck
                productId,
                // @ts-nocheck
                subsriptionDetails: this.getSubscriptionObject(subscription)
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            return productId
            // @ts-nocheck
        } catch (error) {
            // @ts-nocheck
            return ''
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async getFeaturesByPlan(subscriptionId: string, withoutCache: boolean = false) {
        // @ts-nocheck
        if (!this.stripe || !subscriptionId) {
            // @ts-nocheck
            return {}
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        if (!withoutCache) {
            // @ts-nocheck
            const subscriptionData = await this.cacheManager.getSubscriptionDataFromCache(subscriptionId)
            // @ts-nocheck
            if (subscriptionData?.features) {
                // @ts-nocheck
                return subscriptionData.features
                // @ts-nocheck
            }
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
            // @ts-nocheck
            timeout: 5000
            // @ts-nocheck
        })
        // @ts-nocheck
        const items = subscription.items.data
        // @ts-nocheck
        if (items.length === 0) {
            // @ts-nocheck
            return {}
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        const productId = items[0].price.product as string
        // @ts-nocheck
        const product = await this.stripe.products.retrieve(productId, {
            // @ts-nocheck
            timeout: 5000
            // @ts-nocheck
        })
        // @ts-nocheck
        const productMetadata = product.metadata
        // @ts-nocheck

        // @ts-nocheck
        if (!productMetadata || Object.keys(productMetadata).length === 0) {
            // @ts-nocheck
            return {}
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        const features: Record<string, string> = {}
        // @ts-nocheck
        for (const key in productMetadata) {
            // @ts-nocheck
            if (key.startsWith('feat:')) {
                // @ts-nocheck
                features[key] = productMetadata[key]
                // @ts-nocheck
            }
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        await this.cacheManager.updateSubscriptionDataToCache(subscriptionId, {
            // @ts-nocheck
            features,
            // @ts-nocheck
            subsriptionDetails: this.getSubscriptionObject(subscription)
            // @ts-nocheck
        })
        // @ts-nocheck

        // @ts-nocheck
        return features
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async createStripeCustomerPortalSession(req: Request) {
        // @ts-nocheck
        if (!this.stripe) {
            // @ts-nocheck
            throw new Error('Stripe is not initialized')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        const customerId = req.user?.activeOrganizationCustomerId
        // @ts-nocheck
        if (!customerId) {
            // @ts-nocheck
            throw new Error('Customer ID is required')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        const subscriptionId = req.user?.activeOrganizationSubscriptionId
        // @ts-nocheck
        if (!subscriptionId) {
            // @ts-nocheck
            throw new Error('Subscription ID is required')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        try {
            // @ts-nocheck
            const prodPriceIds = await this.getPriceIds()
            // @ts-nocheck
            const configuration = await this.createPortalConfiguration(prodPriceIds)
            // @ts-nocheck

            // @ts-nocheck
            const portalSession = await this.stripe.billingPortal.sessions.create({
                // @ts-nocheck
                customer: customerId,
                // @ts-nocheck
                configuration: configuration.id,
                // @ts-nocheck
                return_url: `${process.env.APP_URL}/account`
                // @ts-nocheck
                /* We can't have flow_data because it does not support multiple subscription items
// @ts-nocheck
                flow_data: {
// @ts-nocheck
                    type: 'subscription_update',
// @ts-nocheck
                    subscription_update: {
// @ts-nocheck
                        subscription: subscriptionId
// @ts-nocheck
                    },
// @ts-nocheck
                    after_completion: {
// @ts-nocheck
                        type: 'redirect',
// @ts-nocheck
                        redirect: {
// @ts-nocheck
                            return_url: `${process.env.APP_URL}/account/subscription?subscriptionId=${subscriptionId}`
// @ts-nocheck
                        }
// @ts-nocheck
                    }
// @ts-nocheck
                }*/
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            return { url: portalSession.url }
            // @ts-nocheck
        } catch (error) {
            // @ts-nocheck
            console.error('Error creating customer portal session:', error)
            // @ts-nocheck
            throw error
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    private async getPriceIds() {
        // @ts-nocheck
        const prodPriceIds: Record<string, { product: string; price: string }> = {
            // @ts-nocheck
            [UserPlan.STARTER]: {
                // @ts-nocheck
                product: process.env.CLOUD_STARTER_ID as string,
                // @ts-nocheck
                price: ''
                // @ts-nocheck
            },
            // @ts-nocheck
            [UserPlan.PRO]: {
                // @ts-nocheck
                product: process.env.CLOUD_PRO_ID as string,
                // @ts-nocheck
                price: ''
                // @ts-nocheck
            },
            // @ts-nocheck
            [UserPlan.FREE]: {
                // @ts-nocheck
                product: process.env.CLOUD_FREE_ID as string,
                // @ts-nocheck
                price: ''
                // @ts-nocheck
            },
            // @ts-nocheck
            SEAT: {
                // @ts-nocheck
                product: process.env.ADDITIONAL_SEAT_ID as string,
                // @ts-nocheck
                price: ''
                // @ts-nocheck
            }
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        for (const key in prodPriceIds) {
            // @ts-nocheck
            const prices = await this.stripe!.prices.list({
                // @ts-nocheck
                product: prodPriceIds[key].product,
                // @ts-nocheck
                active: true,
                // @ts-nocheck
                limit: 1
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            if (prices.data.length) {
                // @ts-nocheck
                prodPriceIds[key].price = prices.data[0].id
                // @ts-nocheck
            }
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        return prodPriceIds
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    private async createPortalConfiguration(_: Record<string, { product: string; price: string }>) {
        // @ts-nocheck
        return await this.stripe!.billingPortal.configurations.create({
            // @ts-nocheck
            business_profile: {
                // @ts-nocheck
                privacy_policy_url: `${process.env.APP_URL}/privacy-policy`,
                // @ts-nocheck
                terms_of_service_url: `${process.env.APP_URL}/terms-of-service`
                // @ts-nocheck
            },
            // @ts-nocheck
            features: {
                // @ts-nocheck
                invoice_history: {
                    // @ts-nocheck
                    enabled: true
                    // @ts-nocheck
                },
                // @ts-nocheck
                payment_method_update: {
                    // @ts-nocheck
                    enabled: true
                    // @ts-nocheck
                },
                // @ts-nocheck
                subscription_cancel: {
                    // @ts-nocheck
                    enabled: false
                    // @ts-nocheck
                }
                // @ts-nocheck
                /*subscription_update: {
// @ts-nocheck
                    enabled: false,
// @ts-nocheck
                    default_allowed_updates: ['price'],
// @ts-nocheck
                    products: [
// @ts-nocheck
                        {
// @ts-nocheck
                            product: prodPriceIds[UserPlan.FREE].product,
// @ts-nocheck
                            prices: [prodPriceIds[UserPlan.FREE].price]
// @ts-nocheck
                        },
// @ts-nocheck
                        {
// @ts-nocheck
                            product: prodPriceIds[UserPlan.STARTER].product,
// @ts-nocheck
                            prices: [prodPriceIds[UserPlan.STARTER].price]
// @ts-nocheck
                        },
// @ts-nocheck
                        {
// @ts-nocheck
                            product: prodPriceIds[UserPlan.PRO].product,
// @ts-nocheck
                            prices: [prodPriceIds[UserPlan.PRO].price]
// @ts-nocheck
                        }
// @ts-nocheck
                    ],
// @ts-nocheck
                    proration_behavior: 'always_invoice'
// @ts-nocheck
                }*/
                // @ts-nocheck
            }
            // @ts-nocheck
        })
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async getAdditionalSeatsQuantity(subscriptionId: string): Promise<{ quantity: number; includedSeats: number }> {
        // @ts-nocheck
        if (!this.stripe) {
            // @ts-nocheck
            throw new Error('Stripe is not initialized')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        try {
            // @ts-nocheck
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
            // @ts-nocheck
            const additionalSeatsItem = subscription.items.data.find(
                // @ts-nocheck
                (item) => (item.price.product as string) === process.env.ADDITIONAL_SEAT_ID
                // @ts-nocheck
            )
            // @ts-nocheck
            const quotas = await this.cacheManager.getQuotas(subscriptionId)
            // @ts-nocheck

            // @ts-nocheck
            return { quantity: additionalSeatsItem?.quantity || 0, includedSeats: quotas[LICENSE_QUOTAS.USERS_LIMIT] }
            // @ts-nocheck
        } catch (error) {
            // @ts-nocheck
            console.error('Error getting additional seats quantity:', error)
            // @ts-nocheck
            throw error
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async getCustomerWithDefaultSource(customerId: string) {
        // @ts-nocheck
        if (!this.stripe) {
            // @ts-nocheck
            throw new Error('Stripe is not initialized')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        try {
            // @ts-nocheck
            const customer = (await this.stripe.customers.retrieve(customerId, {
                // @ts-nocheck
                expand: ['default_source', 'invoice_settings.default_payment_method']
                // @ts-nocheck
            })) as Stripe.Customer
            // @ts-nocheck

            // @ts-nocheck
            return customer
            // @ts-nocheck
        } catch (error) {
            // @ts-nocheck
            console.error('Error retrieving customer with default source:', error)
            // @ts-nocheck
            throw error
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async getAdditionalSeatsProration(subscriptionId: string, quantity: number) {
        // @ts-nocheck
        if (!this.stripe) {
            // @ts-nocheck
            throw new Error('Stripe is not initialized')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        try {
            // @ts-nocheck
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
            // @ts-nocheck

            // @ts-nocheck
            // Get customer's credit balance
            // @ts-nocheck
            const customer = await this.stripe.customers.retrieve(subscription.customer as string)
            // @ts-nocheck
            const creditBalance = (customer as Stripe.Customer).balance // Balance is in cents, negative for credit, positive for amount owed
            // @ts-nocheck

            // @ts-nocheck
            // Get the current subscription's base price (without seats)
            // @ts-nocheck
            const basePlanItem = subscription.items.data.find((item) => (item.price.product as string) !== process.env.ADDITIONAL_SEAT_ID)
            // @ts-nocheck
            const basePlanAmount = basePlanItem ? basePlanItem.price.unit_amount! * 1 : 0
            // @ts-nocheck

            // @ts-nocheck
            const existingInvoice = await this.stripe.invoices.retrieveUpcoming({
                // @ts-nocheck
                customer: subscription.customer as string,
                // @ts-nocheck
                subscription: subscriptionId
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            const existingInvoiceTotal = existingInvoice.total
            // @ts-nocheck

            // @ts-nocheck
            // Get the price ID for additional seats
            // @ts-nocheck
            const prices = await this.stripe.prices.list({
                // @ts-nocheck
                product: process.env.ADDITIONAL_SEAT_ID,
                // @ts-nocheck
                active: true,
                // @ts-nocheck
                limit: 1
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            if (prices.data.length === 0) {
                // @ts-nocheck
                throw new Error('No active price found for additional seats')
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            const seatPrice = prices.data[0]
            // @ts-nocheck
            const pricePerSeat = seatPrice.unit_amount || 0
            // @ts-nocheck

            // @ts-nocheck
            // Use current timestamp for proration calculation
            // @ts-nocheck
            const prorationDate = Math.floor(Date.now() / 1000)
            // @ts-nocheck

            // @ts-nocheck
            const additionalSeatsItem = subscription.items.data.find(
                // @ts-nocheck
                (item) => (item.price.product as string) === process.env.ADDITIONAL_SEAT_ID
                // @ts-nocheck
            )
            // @ts-nocheck

            // @ts-nocheck
            const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
                // @ts-nocheck
                customer: subscription.customer as string,
                // @ts-nocheck
                subscription: subscriptionId,
                // @ts-nocheck
                subscription_details: {
                    // @ts-nocheck
                    proration_behavior: 'always_invoice',
                    // @ts-nocheck
                    proration_date: prorationDate,
                    // @ts-nocheck
                    items: [
                        // @ts-nocheck
                        additionalSeatsItem
                            ? // @ts-nocheck
                              {
                                  // @ts-nocheck
                                  id: additionalSeatsItem.id,
                                  // @ts-nocheck
                                  quantity: quantity
                                  // @ts-nocheck
                              }
                            : // @ts-nocheck
                              {
                                  // @ts-nocheck
                                  // If the item doesn't exist yet, create a new one
                                  // @ts-nocheck
                                  // This will be used to calculate the proration amount
                                  // @ts-nocheck
                                  price: prices.data[0].id,
                                  // @ts-nocheck
                                  quantity: quantity
                                  // @ts-nocheck
                              }
                        // @ts-nocheck
                    ]
                    // @ts-nocheck
                }
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            // Calculate proration amount from the relevant line items
            // @ts-nocheck
            // Only consider prorations that match our proration date
            // @ts-nocheck
            const prorationLineItems = upcomingInvoice.lines.data.filter(
                // @ts-nocheck
                (line) => line.type === 'invoiceitem' && line.period.start === prorationDate
                // @ts-nocheck
            )
            // @ts-nocheck

            // @ts-nocheck
            const prorationAmount = prorationLineItems.reduce((total, item) => total + item.amount, 0)
            // @ts-nocheck

            // @ts-nocheck
            return {
                // @ts-nocheck
                basePlanAmount: basePlanAmount / 100,
                // @ts-nocheck
                additionalSeatsProratedAmount: (existingInvoiceTotal + prorationAmount - basePlanAmount) / 100,
                // @ts-nocheck
                seatPerUnitPrice: pricePerSeat / 100,
                // @ts-nocheck
                prorationAmount: prorationAmount / 100,
                // @ts-nocheck
                creditBalance: creditBalance / 100,
                // @ts-nocheck
                nextInvoiceTotal: (existingInvoiceTotal + prorationAmount) / 100,
                // @ts-nocheck
                currency: upcomingInvoice.currency.toUpperCase(),
                // @ts-nocheck
                prorationDate,
                // @ts-nocheck
                currentPeriodStart: subscription.current_period_start,
                // @ts-nocheck
                currentPeriodEnd: subscription.current_period_end
                // @ts-nocheck
            }
            // @ts-nocheck
        } catch (error) {
            // @ts-nocheck
            console.error('Error calculating additional seats proration:', error)
            // @ts-nocheck
            throw error
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async updateAdditionalSeats(subscriptionId: string, quantity: number, prorationDate: number) {
        // @ts-nocheck
        if (!this.stripe) {
            // @ts-nocheck
            throw new Error('Stripe is not initialized')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        try {
            // @ts-nocheck
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
            // @ts-nocheck
            const additionalSeatsItem = subscription.items.data.find(
                // @ts-nocheck
                (item) => (item.price.product as string) === process.env.ADDITIONAL_SEAT_ID
                // @ts-nocheck
            )
            // @ts-nocheck

            // @ts-nocheck
            // Get the price ID for additional seats if needed
            // @ts-nocheck
            const prices = await this.stripe.prices.list({
                // @ts-nocheck
                product: process.env.ADDITIONAL_SEAT_ID,
                // @ts-nocheck
                active: true,
                // @ts-nocheck
                limit: 1
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            if (prices.data.length === 0) {
                // @ts-nocheck
                throw new Error('No active price found for additional seats')
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            // Create an invoice immediately for the proration
            // @ts-nocheck
            const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
                // @ts-nocheck
                items: [
                    // @ts-nocheck
                    additionalSeatsItem
                        ? // @ts-nocheck
                          {
                              // @ts-nocheck
                              id: additionalSeatsItem.id,
                              // @ts-nocheck
                              quantity: quantity
                              // @ts-nocheck
                          }
                        : // @ts-nocheck
                          {
                              // @ts-nocheck
                              price: prices.data[0].id,
                              // @ts-nocheck
                              quantity: quantity
                              // @ts-nocheck
                          }
                    // @ts-nocheck
                ],
                // @ts-nocheck
                proration_behavior: 'always_invoice',
                // @ts-nocheck
                proration_date: prorationDate
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            // Get the latest invoice for this subscription
            // @ts-nocheck
            const invoice = await this.stripe.invoices.list({
                // @ts-nocheck
                subscription: subscriptionId,
                // @ts-nocheck
                limit: 1
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            if (invoice.data.length > 0) {
                // @ts-nocheck
                const latestInvoice = invoice.data[0]
                // @ts-nocheck
                // Only try to pay if the invoice is not already paid
                // @ts-nocheck
                if (latestInvoice.status !== 'paid') {
                    // @ts-nocheck
                    await this.stripe.invoices.pay(latestInvoice.id)
                    // @ts-nocheck
                }
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            return {
                // @ts-nocheck
                success: true,
                // @ts-nocheck
                subscription: updatedSubscription,
                // @ts-nocheck
                invoice: invoice.data[0]
                // @ts-nocheck
            }
            // @ts-nocheck
        } catch (error) {
            // @ts-nocheck
            console.error('Error updating additional seats:', error)
            // @ts-nocheck
            throw error
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async getPlanProration(subscriptionId: string, newPlanId: string) {
        // @ts-nocheck
        if (!this.stripe) {
            // @ts-nocheck
            throw new Error('Stripe is not initialized')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        try {
            // @ts-nocheck
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
            // @ts-nocheck
            const customerId = subscription.customer as string
            // @ts-nocheck

            // @ts-nocheck
            // Get customer's credit balance and metadata
            // @ts-nocheck
            const customer = await this.stripe.customers.retrieve(customerId)
            // @ts-nocheck
            const creditBalance = (customer as Stripe.Customer).balance
            // @ts-nocheck
            const customerMetadata = (customer as Stripe.Customer).metadata || {}
            // @ts-nocheck

            // @ts-nocheck
            // Get the price ID for the new plan
            // @ts-nocheck
            const prices = await this.stripe.prices.list({
                // @ts-nocheck
                product: newPlanId,
                // @ts-nocheck
                active: true,
                // @ts-nocheck
                limit: 1
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            if (prices.data.length === 0) {
                // @ts-nocheck
                throw new Error('No active price found for the selected plan')
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            const newPlan = prices.data[0]
            // @ts-nocheck
            const newPlanPrice = newPlan.unit_amount || 0
            // @ts-nocheck

            // @ts-nocheck
            // Check if this is the STARTER plan and eligible for first month free
            // @ts-nocheck
            const isStarterPlan = newPlanId === process.env.CLOUD_STARTER_ID
            // @ts-nocheck
            const hasUsedFirstMonthFreeCoupon = customerMetadata.has_used_first_month_free === 'true'
            // @ts-nocheck
            const eligibleForFirstMonthFree = isStarterPlan && !hasUsedFirstMonthFreeCoupon
            // @ts-nocheck

            // @ts-nocheck
            // Use current timestamp for proration calculation
            // @ts-nocheck
            const prorationDate = Math.floor(Date.now() / 1000)
            // @ts-nocheck

            // @ts-nocheck
            const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
                // @ts-nocheck
                customer: customerId,
                // @ts-nocheck
                subscription: subscriptionId,
                // @ts-nocheck
                subscription_details: {
                    // @ts-nocheck
                    proration_behavior: 'always_invoice',
                    // @ts-nocheck
                    proration_date: prorationDate,
                    // @ts-nocheck
                    items: [
                        // @ts-nocheck
                        {
                            // @ts-nocheck
                            id: subscription.items.data[0].id,
                            // @ts-nocheck
                            price: newPlan.id
                            // @ts-nocheck
                        }
                        // @ts-nocheck
                    ]
                    // @ts-nocheck
                }
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            let prorationAmount = upcomingInvoice.lines.data.reduce((total, item) => total + item.amount, 0)
            // @ts-nocheck
            if (eligibleForFirstMonthFree) {
                // @ts-nocheck
                prorationAmount = 0
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            return {
                // @ts-nocheck
                newPlanAmount: newPlanPrice / 100,
                // @ts-nocheck
                prorationAmount: prorationAmount / 100,
                // @ts-nocheck
                creditBalance: creditBalance / 100,
                // @ts-nocheck
                currency: upcomingInvoice.currency.toUpperCase(),
                // @ts-nocheck
                prorationDate,
                // @ts-nocheck
                currentPeriodStart: subscription.current_period_start,
                // @ts-nocheck
                currentPeriodEnd: subscription.current_period_end,
                // @ts-nocheck
                eligibleForFirstMonthFree
                // @ts-nocheck
            }
            // @ts-nocheck
        } catch (error) {
            // @ts-nocheck
            console.error('Error calculating plan proration:', error)
            // @ts-nocheck
            throw error
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck

    // @ts-nocheck
    public async updateSubscriptionPlan(subscriptionId: string, newPlanId: string, prorationDate: number) {
        // @ts-nocheck
        if (!this.stripe) {
            // @ts-nocheck
            throw new Error('Stripe is not initialized')
            // @ts-nocheck
        }
        // @ts-nocheck

        // @ts-nocheck
        try {
            // @ts-nocheck
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
            // @ts-nocheck
            const customerId = subscription.customer as string
            // @ts-nocheck

            // @ts-nocheck
            // Get customer details and metadata
            // @ts-nocheck
            const customer = await this.stripe.customers.retrieve(customerId)
            // @ts-nocheck
            const customerMetadata = (customer as Stripe.Customer).metadata || {}
            // @ts-nocheck

            // @ts-nocheck
            // Get the price ID for the new plan
            // @ts-nocheck
            const prices = await this.stripe.prices.list({
                // @ts-nocheck
                product: newPlanId,
                // @ts-nocheck
                active: true,
                // @ts-nocheck
                limit: 1
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            if (prices.data.length === 0) {
                // @ts-nocheck
                throw new Error('No active price found for the selected plan')
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            const newPlan = prices.data[0]
            // @ts-nocheck
            let updatedSubscription: Stripe.Response<Stripe.Subscription>
            // @ts-nocheck

            // @ts-nocheck
            // Check if this is an upgrade to CLOUD_STARTER_ID and eligible for first month free
            // @ts-nocheck
            const isStarterPlan = newPlanId === process.env.CLOUD_STARTER_ID
            // @ts-nocheck
            const hasUsedFirstMonthFreeCoupon = customerMetadata.has_used_first_month_free === 'true'
            // @ts-nocheck

            // @ts-nocheck
            if (isStarterPlan && !hasUsedFirstMonthFreeCoupon) {
                // @ts-nocheck
                // Create the one-time 100% off coupon
                // @ts-nocheck
                const coupon = await this.stripe.coupons.create({
                    // @ts-nocheck
                    duration: 'once',
                    // @ts-nocheck
                    percent_off: 100,
                    // @ts-nocheck
                    max_redemptions: 1,
                    // @ts-nocheck
                    metadata: {
                        // @ts-nocheck
                        type: 'first_month_free',
                        // @ts-nocheck
                        customer_id: customerId,
                        // @ts-nocheck
                        plan_id: process.env.CLOUD_STARTER_ID || ''
                        // @ts-nocheck
                    }
                    // @ts-nocheck
                })
                // @ts-nocheck

                // @ts-nocheck
                // Create a promotion code linked to the coupon
                // @ts-nocheck
                const promotionCode = await this.stripe.promotionCodes.create({
                    // @ts-nocheck
                    coupon: coupon.id,
                    // @ts-nocheck
                    max_redemptions: 1
                    // @ts-nocheck
                })
                // @ts-nocheck

                // @ts-nocheck
                // Update the subscription with the new plan and apply the promotion code
                // @ts-nocheck
                updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
                    // @ts-nocheck
                    items: [
                        // @ts-nocheck
                        {
                            // @ts-nocheck
                            id: subscription.items.data[0].id,
                            // @ts-nocheck
                            price: newPlan.id
                            // @ts-nocheck
                        }
                        // @ts-nocheck
                    ],
                    // @ts-nocheck
                    proration_behavior: 'always_invoice',
                    // @ts-nocheck
                    proration_date: prorationDate,
                    // @ts-nocheck
                    promotion_code: promotionCode.id
                    // @ts-nocheck
                })
                // @ts-nocheck

                // @ts-nocheck
                // Update customer metadata to mark the coupon as used
                // @ts-nocheck
                await this.stripe.customers.update(customerId, {
                    // @ts-nocheck
                    metadata: {
                        // @ts-nocheck
                        ...customerMetadata,
                        // @ts-nocheck
                        has_used_first_month_free: 'true',
                        // @ts-nocheck
                        first_month_free_date: new Date().toISOString()
                        // @ts-nocheck
                    }
                    // @ts-nocheck
                })
                // @ts-nocheck
            } else {
                // @ts-nocheck
                // Regular plan update without coupon
                // @ts-nocheck
                updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
                    // @ts-nocheck
                    items: [
                        // @ts-nocheck
                        {
                            // @ts-nocheck
                            id: subscription.items.data[0].id,
                            // @ts-nocheck
                            price: newPlan.id
                            // @ts-nocheck
                        }
                        // @ts-nocheck
                    ],
                    // @ts-nocheck
                    proration_behavior: 'always_invoice',
                    // @ts-nocheck
                    proration_date: prorationDate
                    // @ts-nocheck
                })
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            // Get and pay the latest invoice
            // @ts-nocheck
            const invoice = await this.stripe.invoices.list({
                // @ts-nocheck
                subscription: subscriptionId,
                // @ts-nocheck
                limit: 1
                // @ts-nocheck
            })
            // @ts-nocheck

            // @ts-nocheck
            if (invoice.data.length > 0) {
                // @ts-nocheck
                const latestInvoice = invoice.data[0]
                // @ts-nocheck
                if (latestInvoice.status !== 'paid') {
                    // @ts-nocheck
                    await this.stripe.invoices.pay(latestInvoice.id)
                    // @ts-nocheck
                }
                // @ts-nocheck
            }
            // @ts-nocheck

            // @ts-nocheck
            return {
                // @ts-nocheck
                success: true,
                // @ts-nocheck
                subscription: updatedSubscription,
                // @ts-nocheck
                invoice: invoice.data[0]
                // @ts-nocheck
            }
            // @ts-nocheck
        } catch (error) {
            // @ts-nocheck
            console.error('Error updating subscription plan:', error)
            // @ts-nocheck
            throw error
            // @ts-nocheck
        }
        // @ts-nocheck
    }
    // @ts-nocheck
}
