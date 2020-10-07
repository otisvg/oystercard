class Oystercard
  attr_reader :balance

  BALANCE_LIMIT = 90

  def initialize
    @balance = 0
  end

  def top_up(added_balance)
    raise "Top-up failed. Balance limit of #{BALANCE_LIMIT} exceeded." if @balance + added_balance > BALANCE_LIMIT
    @balance += added_balance
  end

  def deduct(deducted_balance)
    @balance -= deducted_balance
  end

end
