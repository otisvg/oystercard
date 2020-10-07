class Oystercard
  attr_reader :balance

  BALANCE_LIMIT = 90

  def initialize
    @balance = 0
    @in_journey = false
  end

  def top_up(added_balance)
    raise "Top-up failed. Balance limit of #{BALANCE_LIMIT} exceeded." if @balance + added_balance > BALANCE_LIMIT
    @balance += added_balance
  end

  def deduct(deducted_balance)
    @balance -= deducted_balance
  end

  def touch_in
    @in_journey = true
  end

  def touch_out
    @in_journey = false
  end

  def in_journey?
    return @in_journey
  end
  
end
