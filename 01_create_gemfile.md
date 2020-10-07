# Create Gemfile

[Back to the challenge map](README.md)

The very first step of starting a Ruby project is to initialize it with a Gemfile. Gemfiles act as a reference for all the libraries (‘gems’) we’re going to use in this project. We will use Bundler, a dependency manager, to work with the gems listed in the Gemfile. Finally, we'll use Ruby Version Manager (RVM) to install and manage different versions of Ruby.

In this issue you will create a valid Gemfile for this project.

## Learning Objectives covered:
- Installing and upgrading gems using Bundler
- Using RVM to check what ruby versions you have installed and in use
- Using Gemfile to list the gems that will be used in the project

## Interview questions you may expect:
- Explain what RVM is and how you use it.
- Explain how Ruby gems help reuse code across projects.
- Explain how do you use Bundler to manage Ruby gems.
- Explain the structure of a Gemfile.

## To complete this challenge:
- [ ] construct a valid Gemfile
- [ ] specify a correct source for gems
- [ ] specify the latest Ruby version
- [ ] add the `rspec` gem to ‘test’ and ’development’ groups
- [ ] commit only this Gemfile

### Hints
<details><summary>CLICK ME</summary>
  <ul>
    <li>We use a Gemfile to manage the various gems our Ruby projects depend upon.  We can set one up from the terminal - check the linked documents below for information on how to do so</li>
    <li>Once we have a Gemfile, we can use it to specify various requirements of our project.  Take a look at the final link below for more.  The most important thing for us to do right now is to list the gems we expect to use.  As far as we know at this point, the only gem we'll be depending on is RSpec.  We'll want to add RSpec, using the Gemfile's group block syntax to specify the environments where we want RSpec to be available.</li>
    <li>Once the contents of our Gem file is complete, we can run `bundle` from the terminal. We can verify that this has been successful by checking that we now have a file called `Gemfile.lock` within out project.</li>
  </ul>
</details>

## Suggested resources
- [RubyGems basics](http://guides.rubygems.org/rubygems-basics)
- [RVM documentation](http://www.rvm.io)
- [Bundler documentation](http://www.bundler.io)
- [Gemfile documentation on bundler.io](http://bundler.io/gemfile.html)
- [What is a Gemfile](http://tosbourn.com/what-is-the-gemfile/)

## [Walkthrough](walkthroughs/01_create_gemfile.md)

[Next Challenge](02_initialize_rspec.md)

![Tracking pixel](https://githubanalytics.herokuapp.com/course/oystercard/01_create_gemfile.md)
