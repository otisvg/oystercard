class Oystercard
  attr_reader :balance, :entry_station, :journeys_history

  BALANCE_LIMIT = 90
  MINIMUM_PERMITTED_FARE = 1


  def initialize
    @balance = 0
    @entry_station = nil
    @journeys_history = []
  end

  def top_up(added_balance)
    raise "Top-up failed. Balance limit of #{BALANCE_LIMIT} exceeded." if @balance + added_balance > BALANCE_LIMIT
    @balance += added_balance
  end

  def touch_in(station)
    raise 'Not enough money on card' if @balance < MINIMUM_PERMITTED_FARE
    @entry_station = station
  end

  def touch_out
    deduct
    @entry_station = nil
  end

  def in_journey?
    !!entry_station
  end

  private

  def deduct(deducted_balance = MINIMUM_PERMITTED_FARE)
    @balance -= deducted_balance
  end

end
