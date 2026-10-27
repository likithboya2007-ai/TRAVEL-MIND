import React, { useState, useEffect } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getTripMembers, TripMember } from '../services/groupTripService';

interface ExpenseSplitSummaryProps {
  tripId: string;
}

interface UserBalance {
  userId: string;
  email: string;
  paid: number;
  owes: number;
  balance: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export const ExpenseSplitSummary: React.FC<ExpenseSplitSummaryProps> = ({ tripId }) => {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      loadExpenseSplits();
    }
  }, [tripId]);

  const loadExpenseSplits = async () => {
    setLoading(true);
    try {
      // Load members
      const tripMembers = await getTripMembers(tripId);
      setMembers(tripMembers);

      // Load expenses with split data
      const { data: expenses, error } = await supabase
        .from('trip_expenses')
        .select('*')
        .eq('trip_id', tripId);

      if (error) throw error;

      // Calculate balances
      const userBalances = new Map<string, UserBalance>();

      // Initialize balances for all members
      tripMembers.forEach((member) => {
        if (member.user_id) {
          userBalances.set(member.user_id, {
            userId: member.user_id,
            email: member.invited_email,
            paid: 0,
            owes: 0,
            balance: 0,
          });
        }
      });

      // Calculate paid and owes amounts
      expenses?.forEach((expense) => {
        const paidBy = expense.paid_by_user_id;
        const splitBetween = expense.split_between || [];

        if (paidBy && splitBetween.length > 0) {
          const sharePerPerson = expense.amount_inr / splitBetween.length;

          // Person who paid
          const payer = userBalances.get(paidBy);
          if (payer) {
            payer.paid += expense.amount_inr;
          }

          // Everyone who owes
          splitBetween.forEach((userId: string) => {
            const person = userBalances.get(userId);
            if (person) {
              person.owes += sharePerPerson;
            }
          });
        }
      });

      // Calculate net balance
      userBalances.forEach((balance) => {
        balance.balance = balance.paid - balance.owes;
      });

      const balanceArray = Array.from(userBalances.values());
      setBalances(balanceArray);

      // Calculate settlements (simplified debt resolution)
      const settles = calculateSettlements(balanceArray);
      setSettlements(settles);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load expense splits:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSettlements = (balances: UserBalance[]): Settlement[] => {
    const settlements: Settlement[] = [];
    const debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = balances
      .filter((b) => b.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      if (amount > 0.01) {
        // Avoid tiny amounts
        settlements.push({
          from: debtor.email,
          to: creditor.email,
          amount: Math.round(amount * 100) / 100,
        });

        debtor.balance += amount;
        creditor.balance -= amount;
      }

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }

    return settlements;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Expense Split</h3>
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return null; // No members, no split
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Expense Split</h3>
      </div>

      {/* Individual Balances */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Individual Balances</h4>
        {balances.length === 0 ? (
          <p className="text-sm text-gray-500">No expense splits yet</p>
        ) : (
          <div className="space-y-2">
            {balances.map((balance) => (
              <div
                key={balance.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{balance.email}</p>
                  <p className="text-xs text-gray-600">
                    Paid: ₹{balance.paid.toLocaleString('en-IN')} • Owes: ₹
                    {balance.owes.toLocaleString('en-IN')}
                  </p>
                </div>
                <div
                  className={`font-semibold text-sm ${
                    balance.balance > 0
                      ? 'text-green-600'
                      : balance.balance < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {balance.balance > 0 ? '+' : ''}₹{balance.balance.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Who Owes Whom */}
      {settlements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Who Owes Whom</h4>
          <div className="space-y-2">
            {settlements.map((settlement, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-900">{settlement.from}</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">{settlement.to}</span>
                <span className="ml-auto text-sm font-bold text-blue-600">
                  ₹{settlement.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
