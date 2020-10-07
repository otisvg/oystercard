# Learn debugging basics

[Back to the challenge map](README.md)

If you set up your `Oystercard` test file correctly, it should look something like this:

```ruby
# in spec/oystercard_spec.rb
describe Oystercard do
end
```
Try running `rspec` from the command line to load and run the contents of this file. You should get an error.

As we discovered last week, errors are good. In this challenge, you will dissect another Command Line error message.

## Learning Objectives covered
- Use a stack trace to debug an error.

## Interview questions you may expect:
- Explain what a stack trace is.

## To complete this challenge:
- [ ] Write down the type of error in the issue comments
- [ ] Write down the file path where the error happened
- [ ] Write down the line number of the error
- [ ] Use the Ruby Documentation to find out what the error means
- [ ] Suggest one way of solving the error

### Hints
<details><summary>CLICK ME</summary>
  <ul>
    <li>Again, this process is probably starting to feel pretty familiar by now. Read the error message closely and carefully, extracting as much information as you are able to.</li>
  </ul>
</details>

## Suggested resources:
- [Using the stack trace (video)](https://www.youtube.com/watch?v=TF_-tfOc9Pw)
- [Ruby Docs - Exception (Ruby's name for 'error')](http://ruby-doc.org/core-2.2.0/Exception.html)

## [Walkthrough](walkthroughs/03_debugging.md)

[Previous Challenge](02_initialize_rspec.md) | [Next Challenge](04_adding_balance.md)

![Tracking pixel](https://githubanalytics.herokuapp.com/course/oystercard/03_debugging.md)
