const knex = require('../../db/knex');
const bcrypt = require('bcrypt-as-promised')

////////////////////////////////////////////////////////////////////
// USERS
////////////////////////////////////////////////////////////////////


function getAllUsers(users_id){
  return (
    knex('users')
  )
}

function getUserByEmail(email){
  return (
    knex('users')
    .where({ email })
    .first()
  )
}

function getOneUser(id){
  return (
    knex('users')
    .where({ id })
    .first()
  )
}

function createUser(first_name, last_name, email, password){
  return getUserByEmail(email)
  .then(function(data){
    if(data) throw { status: 400, message:'Email already being used'}
    const hp = bcrypt.hash(password, 10)
    return hp
  })
  .then(function(hashedPassword){
    return (
      knex('users')
      .insert({ first_name, last_name, email, hashed_password: hashedPassword })
      .returning('*')
      .then(function([data]){
        return data
      })
    )
  })
}

////////////////////////////////////////////////////////////////////
// DAILIES
////////////////////////////////////////////////////////////////////

function createDaily(users_id, name ) {
  return (
    knex('dailies')
    .insert({ name, users_id})
    .returning('*')
    .then(function([data]){
      return data
    })
  )
}

function getAllDailies(users_id){
  return (
    knex('dailies')
    .where({ users_id })
    .join('users', 'users.id', 'dailies.users_id')
    .select(
      'dailies.id as id',
      'dailies.name as name',
      'dailies.streak as streak',
      'dailies.users_id as users_id',
      'dailies.archived as archived',
      'dailies.created_at as created_at',
      'dailies.updated_at as updated_at',
      'users.first_name'
    )
  )
}

function getOneDaily(users_id, id){
  return (
    knex('dailies')
    .where({ users_id })
    .where({ id })
    .first()
  )
}

function editDaily(users_id, id, name, streak){
  return (
    knex('dailies')
    .where({ id })
    .update({ name, streak })
    .returning('*')
    .then(function([data]){
      return data
    })
  )
}

function patchDaily(id, body){
  return (
    knex('dailies')
    .where({ id })
    .update(body)
    .returning('*')
    .then(function([data]){
      return data
    })
  )
}

////////////////////////////////////////////////////////////////////
// DAILY HISTORY
////////////////////////////////////////////////////////////////////

function createDailyHistory(
  dailies_id,
  completed,
) {
  return (
    knex('daily_history')
    .insert({ completed: completed, dailies_id})
    .returning('*')
    .then(function([data]){
      return data
    })
  )
}

function getMostRecentDailyHistoryForToday(users_id, dailies_id){
  return (
    knex('daily_history')
    .where({ dailies_id })
    .join('dailies', 'dailies.id', 'daily_history.dailies_id')
    .join('users', 'users.id', 'dailies.users_id')
    .select(
      'daily_history.id as id',
      'daily_history.completed as completed',
      'daily_history.dailies_id as dailies_id',
      'daily_history.created_at as created_at',
      'daily_history.updated_at as updated_at',
      'dailies.users_id as users_id',
      'dailies.name as name',
      'users.first_name'
    )
    .where(knex.raw('daily_history.created_at > current_date'))
    .orderBy('created_at', 'desc')
    .first()
    .then(response => {
      return response
    })
  )
}

function getCurrentStreak(dailies_id, daysAgo=0, streak = 0){
  return (
    knex('daily_history')
    .where({ dailies_id })
    .join('dailies', 'dailies.id', 'daily_history.dailies_id')
    .join('users', 'users.id', 'dailies.users_id')
    .select(
      'daily_history.id as id',
      'daily_history.completed as completed',
      'daily_history.dailies_id as dailies_id',
      'daily_history.created_at as created_at',
      'daily_history.updated_at as updated_at',
      'dailies.users_id as users_id',
      'dailies.name as name',
      'users.first_name'
    )
    .where(knex.raw(`daily_history.created_at < current_date - ${daysAgo-1}`))
    .where(knex.raw(`daily_history.created_at > current_date - ${daysAgo}`))
    .orderBy('created_at', 'desc')
    .first()
    .then(row => {
      if(row && row.completed) {
        return getCurrentStreak(dailies_id, daysAgo+1, streak+1)
      } else {
        return streak
      }
    })
    .catch(() => {
      return streak
    })

  )
}

function getOneDailyHistory(users_id, dailies_id, id){
  return (
    knex('daily_history')
    .where({ id })
    .first()
  )
}

function patchDailyHistory(id, completed){
  return (
    knex('daily_history')
    .where({ id })
    .update({ completed })
    .returning('*')
    .then(function([data]){
      return data
    })
  )
}

////////////////////////////////////////////////////////////////////
// DUELS
////////////////////////////////////////////////////////////////////

function createDuel(u1_id, u2_id, start_time, end_time, u2_accepted, u1_confirmed, rejected, winner_id ) {
  return (
    knex('duels')
    .insert({ u1_id, u2_id, start_time, end_time, u2_accepted, u1_confirmed, rejected, winner_id })
    .returning('*')
    .then(function([data]){
      return data
    })
  )
}

function getAllUserDuels(users_id){
  return (
    knex('duels')
    .where(function () {
      this
        .where('u1_id', users_id)
        .orWhere('u2_id', users_id)
    })
    .join('users as u1', 'u1.id', 'duels.u1_id')
    .join('users as u2', 'u2.id', 'duels.u2_id')
    .select(
      'duels.id as id',
      'duels.u1_id as u1_id',
      'duels.u2_id as u2_id',
      'duels.start_time as start_time',
      'duels.end_time as end_time',
      'duels.u2_accepted as u2_accepted',
      'duels.u1_confirmed as u1_confirmed',
      'duels.rejected as rejected',
      'duels.winner_id as winner_id',
      'duels.created_at as created_at',
      'duels.updated_at as updated_at',
      'duels.archived as archived',
      'u2.first_name as u2_name',
      'u1.first_name as u1_name'
    )
  )
}

// function getOneDuel(id){
//   return (
//     knex('duels')
//     .where({ id })
//     .first()
//   )
// }

function getOneDuel(id){
  return(
    knex.raw(`select duels.id as duel_id, duels.u1_id as duel_u1id, duels.u2_id as duel_u2id, duels.start_time as duel_start, duels.end_time as duel_end, duels.u2_accepted as duel_accepted, duels.u1_confirmed as duel_confirmed, duels.winner_id as duel_winner_id, duels.rejected as duel_rejected, duels.archived as duel_archived, daily_history.id as dh_id, daily_history.dailies_id as dh_dailies_id, daily_history.completed as dh_completed, dailies.name as dailies_name, u1.first_name as user1, u2.first_name as user2 from duels
      inner join duel_dailies on duels.id = duel_dailies.duel_id
      left join dailies on duel_dailies.dailies_id = dailies.id
      inner join daily_history on dailies.id = daily_history.dailies_id
      inner join users as u1 on duels.u1_id = u1.id
      inner join users as u2 on duels.u2_id = u2.id where duels.id = ${id};`
    )
  )
}

function editDuel(id, u1_id, u2_id, start_time, end_time, u2_accepted, u1_confirmed, rejected, winner_id ) {
  return (
    knex('duels')
    .where({ id })
    .update({ u1_id, u2_id, start_time, end_time, u2_accepted, u1_confirmed, rejected, winner_id })
    .returning('*')
    .then(function([data]){
      return data
    })
  )
}

function patchDuel(id, body){
  return (
    knex('duels')
    .where({ id })
    .update(body)
    .returning('*')
    .then(function([data]){
      return data
    })
  )
}

////////////////////////////////////////////////////////////////////
// DUEL_DAILIES
////////////////////////////////////////////////////////////////////

function getAllDuelDailies(duel_id){
  return (
    knex('duel_dailies')
    .where({ duel_id })
    .join('dailies', 'dailies.id', 'duel_dailies.dailies_id')
    .select(
      'duel_dailies.id as id',
      'duel_dailies.dailies_id as dailies_id',
      'duel_dailies.duel_id as duel_id',
      'dailies.users_id as users_id'
    )
  )
}

////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////

module.exports = {
  // Users
  createUser,
  getAllUsers,
  getUserByEmail,
  getOneUser,
  // Dailies
  createDaily,
  getAllDailies,
  getOneDaily,
  editDaily,
  patchDaily,
  // Daily History
  createDailyHistory,
  getMostRecentDailyHistoryForToday,
  getCurrentStreak,
  getOneDailyHistory,
  patchDailyHistory,
  // Duels
  createDuel,
  getAllUserDuels,
  getOneDuel,
  editDuel,
  patchDuel,
  // Duel dailies
  getAllDuelDailies
}
